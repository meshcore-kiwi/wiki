import type { APIRoute } from 'astro';
import { commitAuthor, singleLine } from '../../../lib/attribution';
import { currentDraft, DraftLimitError, touchDraft } from '../../../lib/drafts';
import { changedFiles, readFile, writeFile } from '../../../lib/github/client';
import { assertContentPath, UnsafePathError } from '../../../lib/github/paths';
import { sidebarOrder, spliceContentFile } from '../../../lib/editor/frontmatter';
import { unescapeLinkAmpersands } from '../../../lib/editor/format';

export const prerender = false;

const MAX_BYTES = 256 * 1024;

export const POST: APIRoute = async (ctx) => {
	const user = ctx.locals.user;
	if (!user) return Response.json({ error: 'Sign in to edit' }, { status: 401 });

	const body = (await ctx.request.json().catch(() => null)) as {
		path?: unknown;
		body?: unknown;
		frontmatter?: { title?: unknown; description?: unknown; order?: unknown };
		summary?: unknown;
	} | null;

	let path: string;
	try {
		path = assertContentPath(body?.path);
	} catch (e) {
		// A rejected path is either a bug in our own editor or someone probing,
		// so say what was wrong without echoing the path back.
		return Response.json(
			{ error: e instanceof UnsafePathError ? e.message : 'Invalid path' },
			{ status: 400 },
		);
	}

	if (typeof body?.body !== 'string' || body.body.trim() === '') {
		return Response.json({ error: 'No content to save' }, { status: 400 });
	}
	if (new TextEncoder().encode(body.body).byteLength > MAX_BYTES) {
		return Response.json({ error: 'That page is too large to save' }, { status: 413 });
	}

	const title = singleLine(
		typeof body.frontmatter?.title === 'string' ? body.frontmatter.title : '',
		120,
	);
	if (!title) return Response.json({ error: 'A page needs a title' }, { status: 400 });

	const order = sidebarOrder(body.frontmatter?.order);

	// 72 is the conventional git subject limit.
	const summary =
		singleLine(typeof body.summary === 'string' ? body.summary : '', 72) ||
		`Update ${path.replace('src/content/docs/', '')}`;

	try {
		const draft = await currentDraft(user.id);

		// Read the sha from the draft branch, not main: a second save of the
		// same page must replace the blob this branch already has. The text is
		// also the basis for the splice, so frontmatter keys the editor does
		// not manage survive untouched.
		const existing = await readFile(path, draft.branch);
		if (!existing) {
			return Response.json({ error: 'That page no longer exists' }, { status: 409 });
		}

		const text = spliceContentFile(
			existing.text,
			{
				title,
				description:
					typeof body.frontmatter?.description === 'string' ? body.frontmatter.description : '',
				order,
			},
			// Applied here rather than in the browser: this is the single place
			// that produces the bytes actually committed, and the same helper is
			// used by scripts/normalise-content.mjs.
			unescapeLinkAmpersands(body.body),
		);

		if (existing.text === text) {
			return Response.json({
				draftId: draft.id,
				branch: draft.branch,
				unchanged: true,
				files: await changedFiles(draft.branch),
			});
		}

		await writeFile({
			path,
			text,
			message: summary,
			branch: draft.branch,
			author: commitAuthor(user),
			sha: existing.sha,
		});

		// Independent of each other; no reason for the client to wait for both
		// in series.
		const [, files] = await Promise.all([touchDraft(draft.id), changedFiles(draft.branch)]);

		return Response.json({ files });
	} catch (e) {
		if (e instanceof DraftLimitError) return Response.json({ error: e.message }, { status: 429 });
		console.error('[draft/save]', e);
		return Response.json({ error: 'Could not save that change' }, { status: 502 });
	}
};
