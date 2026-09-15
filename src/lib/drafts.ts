import { env } from 'cloudflare:workers';
import { draftBranch } from './github/paths';
import { branchExists, createBranch, defaultBranchSha } from './github/client';

export type DraftStatus = 'open' | 'submitted' | 'merged' | 'closed';

export type Draft = {
	id: string;
	userId: string;
	branch: string;
	title: string | null;
	prNumber: number | null;
	status: DraftStatus;
	createdAt: string;
	updatedAt: string;
};

/** A contributor may have this many drafts awaiting review at once. */
const MAX_OPEN_DRAFTS = 5;

export class DraftLimitError extends Error {}

const now = () => new Date().toISOString();
const shortId = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10);

export async function openDraftFor(userId: string): Promise<Draft | null> {
	return env.DB.prepare(`select * from draft where userId = ? and status = 'open' limit 1`)
		.bind(userId)
		.first<Draft>();
}

/**
 * The contributor's current draft, created on first save. One open draft at a
 * time is deliberate: it is what lets several page edits arrive as a single
 * pull request rather than one per page.
 */
export async function currentDraft(userId: string): Promise<Draft> {
	const existing = await openDraftFor(userId);
	if (existing) return existing;

	const awaiting = await env.DB.prepare(
		`select count(*) as n from draft where userId = ? and status = 'submitted'`,
	)
		.bind(userId)
		.first<{ n: number }>();

	if ((awaiting?.n ?? 0) >= MAX_OPEN_DRAFTS) {
		throw new DraftLimitError(
			`You have ${awaiting?.n} changes awaiting review. Wait for a moderator before starting another.`,
		);
	}

	const id = shortId();
	const branch = draftBranch(userId, id);

	// Independent reads, so no reason to serialise them. The branchExists check
	// guards against a branch left behind by an earlier draft that was never
	// recorded - reusing it would mix two contributions into one PR.
	const [exists, baseSha] = await Promise.all([branchExists(branch), defaultBranchSha()]);
	if (exists) throw new Error(`Branch ${branch} already exists on the remote`);
	await createBranch(branch, baseSha);

	const timestamp = now();
	await env.DB.prepare(
		`insert into draft (id, userId, branch, status, createdAt, updatedAt)
		 values (?, ?, ?, 'open', ?, ?)`,
	)
		.bind(id, userId, branch, timestamp, timestamp)
		.run();

	return {
		id,
		userId,
		branch,
		title: null,
		prNumber: null,
		status: 'open',
		createdAt: timestamp,
		updatedAt: timestamp,
	};
}

export async function touchDraft(id: string): Promise<void> {
	await env.DB.prepare(`update draft set updatedAt = ? where id = ?`).bind(now(), id).run();
}

export async function markSubmitted(id: string, prNumber: number, title: string): Promise<void> {
	await env.DB.prepare(
		`update draft set status = 'submitted', prNumber = ?, title = ?, updatedAt = ? where id = ?`,
	)
		.bind(prNumber, title, now(), id)
		.run();
}

export async function recordOutcome(id: string, status: DraftStatus): Promise<void> {
	await env.DB.prepare(`update draft set status = ?, updatedAt = ? where id = ?`)
		.bind(status, now(), id)
		.run();
}

export async function listDrafts(userId: string): Promise<Draft[]> {
	const { results } = await env.DB.prepare(
		`select * from draft where userId = ? order by createdAt desc limit 20`,
	)
		.bind(userId)
		.all<Draft>();
	return results;
}
