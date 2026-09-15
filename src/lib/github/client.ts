import { env } from 'cloudflare:workers';
import { buildAppJwt } from './jwt';
import { assertContentPath } from './paths';

const API = 'https://api.github.com';
const UA = 'meshcore-kiwi-wiki';

/**
 * Installation tokens last an hour. Cached per isolate, which is the whole
 * point - minting one costs an RSA signature plus a round trip.
 *
 * The PROMISE is cached, not the resolved token: concurrent callers all run
 * the freshness check before any of them resolves, so caching the value meant
 * a page issuing 30 parallel calls minted 30 tokens.
 *
 * ponytail: per-isolate cache, so a busy Worker mints a few of these rather
 * than one. Move it to KV only if the token endpoint's rate limit ever bites.
 */
let cachedToken: { value: Promise<string>; expiresAt: number } | null = null;

function installationToken(): Promise<string> {
	// A minute of headroom so a token cannot expire mid-request.
	if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

	// Assume the documented hour up front; corrected below once GitHub replies.
	cachedToken = { value: mintInstallationToken(), expiresAt: Date.now() + 55 * 60_000 };
	cachedToken.value.catch(() => {
		cachedToken = null;
	});
	return cachedToken.value;
}

async function mintInstallationToken(): Promise<string> {
	const jwt = await buildAppJwt(env.GITHUB_APP_PRIVATE_KEY, env.GITHUB_APP_ID);
	const res = await fetch(
		`${API}/app/installations/${env.GITHUB_APP_INSTALLATION_ID}/access_tokens`,
		{
			method: 'POST',
			headers: {
				authorization: `Bearer ${jwt}`,
				accept: 'application/vnd.github+json',
				'user-agent': UA,
			},
		},
	);

	if (!res.ok) {
		throw new Error(`Could not mint an installation token: ${res.status} ${await res.text()}`);
	}

	const body = (await res.json()) as { token: string; expires_at: string };
	if (cachedToken) cachedToken.expiresAt = Date.parse(body.expires_at);
	return body.token;
}

export class GitHubError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
	}
}

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(`${API}${path}`, {
		...init,
		headers: {
			authorization: `Bearer ${await installationToken()}`,
			accept: 'application/vnd.github+json',
			'content-type': 'application/json',
			'user-agent': UA,
			...init.headers,
		},
	});

	if (!res.ok) {
		throw new GitHubError(`${init.method ?? 'GET'} ${path} -> ${res.status} ${await res.text()}`, res.status);
	}
	return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const repo = () => env.GITHUB_REPO;

/** UTF-8 safe: btoa alone mangles anything non-Latin-1 (the wiki has macrons). */
function toBase64(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function fromBase64(b64: string): string {
	const bytes = Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

export type CommitAuthor = { name: string; email: string };

export async function defaultBranchSha(): Promise<string> {
	const ref = await gh<{ object: { sha: string } }>(`/repos/${repo()}/git/ref/heads/main`);
	return ref.object.sha;
}

export async function branchExists(branch: string): Promise<boolean> {
	try {
		await gh(`/repos/${repo()}/git/ref/heads/${encodeURIComponent(branch)}`);
		return true;
	} catch (e) {
		if (e instanceof GitHubError && e.status === 404) return false;
		throw e;
	}
}

export async function createBranch(branch: string, fromSha: string): Promise<void> {
	await gh(`/repos/${repo()}/git/refs`, {
		method: 'POST',
		body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: fromSha }),
	});
}

/** Current file on a ref, or null if it does not exist there yet. */
export async function readFile(
	path: string,
	ref: string,
): Promise<{ sha: string; text: string } | null> {
	try {
		const file = await gh<{ sha: string; content: string; encoding: string }>(
			`/repos/${repo()}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`,
		);
		return { sha: file.sha, text: fromBase64(file.content) };
	} catch (e) {
		if (e instanceof GitHubError && e.status === 404) return null;
		throw e;
	}
}

/**
 * Every repository write goes through writeFile or deleteFile, so the path
 * guard lives here rather than at the call sites. save.ts also calls it, but
 * only to turn the rejection into a useful 400 - that is presentation. This is
 * the enforcement, and it cannot be forgotten by the next caller.
 */
export async function writeFile(options: {
	path: string;
	text: string;
	message: string;
	branch: string;
	author: CommitAuthor;
	/** Blob sha being replaced. Omit to create. */
	sha?: string;
}): Promise<{ commitSha: string }> {
	assertContentPath(options.path);

	const res = await gh<{ commit: { sha: string } }>(
		`/repos/${repo()}/contents/${encodePath(options.path)}`,
		{
			method: 'PUT',
			body: JSON.stringify({
				message: options.message,
				content: toBase64(options.text),
				branch: options.branch,
				sha: options.sha,
				// The contributor is the author; the App is the committer. GitHub
				// renders this as "X authored, bot committed".
				author: options.author,
			}),
		},
	);
	return { commitSha: res.commit.sha };
}

export async function deleteFile(options: {
	path: string;
	message: string;
	branch: string;
	author: CommitAuthor;
	sha: string;
}): Promise<void> {
	assertContentPath(options.path);

	await gh(`/repos/${repo()}/contents/${encodePath(options.path)}`, {
		method: 'DELETE',
		body: JSON.stringify({
			message: options.message,
			branch: options.branch,
			sha: options.sha,
			author: options.author,
		}),
	});
}

export async function openPullRequest(options: {
	head: string;
	title: string;
	body: string;
}): Promise<{ number: number; url: string }> {
	const pr = await gh<{ number: number; html_url: string }>(`/repos/${repo()}/pulls`, {
		method: 'POST',
		body: JSON.stringify({ ...options, base: 'main', maintainer_can_modify: true }),
	});
	return { number: pr.number, url: pr.html_url };
}

export type PullRequestState = {
	number: number;
	url: string;
	state: 'open' | 'closed';
	merged: boolean;
	changedFiles: number;
};

export async function pullRequestState(number: number): Promise<PullRequestState> {
	const pr = await gh<{
		number: number;
		html_url: string;
		state: 'open' | 'closed';
		merged: boolean;
		changed_files: number;
	}>(`/repos/${repo()}/pulls/${number}`);

	return {
		number: pr.number,
		url: pr.html_url,
		state: pr.state,
		merged: pr.merged,
		changedFiles: pr.changed_files,
	};
}

/** Where a PR lives, without asking GitHub - for drafts already resolved. */
export const pullRequestUrl = (number: number) =>
	`https://github.com/${repo()}/pull/${number}`;

/** Moderator feedback, for the contributions page. */
export async function pullRequestFeedback(number: number): Promise<
	Array<{ kind: 'review' | 'comment'; author: string; state?: string; body: string; at: string }>
> {
	const [reviews, comments] = await Promise.all([
		gh<Array<{ user: { login: string }; state: string; body: string; submitted_at: string }>>(
			`/repos/${repo()}/pulls/${number}/reviews`,
		),
		gh<Array<{ user: { login: string }; body: string; created_at: string }>>(
			`/repos/${repo()}/issues/${number}/comments`,
		),
	]);

	return [
		...reviews
			.filter((r) => r.body || r.state !== 'COMMENTED')
			.map((r) => ({
				kind: 'review' as const,
				author: r.user.login,
				state: r.state,
				body: r.body ?? '',
				at: r.submitted_at,
			})),
		...comments.map((c) => ({
			kind: 'comment' as const,
			author: c.user.login,
			body: c.body,
			at: c.created_at,
		})),
	].sort((a, b) => a.at.localeCompare(b.at));
}

/** Files a draft branch changes relative to main. */
export async function changedFiles(branch: string): Promise<Array<{ path: string; status: string }>> {
	const cmp = await gh<{ files?: Array<{ filename: string; status: string }> }>(
		`/repos/${repo()}/compare/main...${encodeURIComponent(branch)}`,
	);
	return (cmp.files ?? []).map((f) => ({ path: f.filename, status: f.status }));
}

/** Each segment encoded, but the slashes kept - the API path is hierarchical. */
const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');
