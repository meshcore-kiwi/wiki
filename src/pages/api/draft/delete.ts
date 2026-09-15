import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { commitAuthor, singleLine } from '../../../lib/attribution';
import { currentDraft, DraftLimitError, touchDraft } from '../../../lib/drafts';
import { changedFiles, deleteFile, readFile } from '../../../lib/github/client';
import { assertContentPath, UnsafePathError } from '../../../lib/github/paths';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
	const user = ctx.locals.user;
	if (!user) return Response.json({ error: 'Sign in to edit' }, { status: 401 });

	const body = (await ctx.request.json().catch(() => null)) as {
		entryId?: unknown;
		path?: unknown;
		summary?: unknown;
	} | null;

	let path: string;
	try {
		path = assertContentPath(body?.path);
	} catch (e) {
		return Response.json(
			{ error: e instanceof UnsafePathError ? e.message : 'Invalid path' },
			{ status: 400 },
		);
	}

	if (typeof body?.entryId !== 'string' || body.entryId === '') {
		return Response.json({ error: 'Which page?' }, { status: 400 });
	}

	// A page may be deleted exactly when it may be edited. Starlight's own
	// `editUrl: false` is that signal, and it is what keeps the splash home
	// page - the one page whose absence breaks the site rather than merely
	// changing it - out of reach.
	const entry = await getEntry('docs', body.entryId);
	if (!entry) return Response.json({ error: 'No such page' }, { status: 404 });
	if (entry.data.editUrl === false) {
		return Response.json({ error: 'This page cannot be deleted here' }, { status: 403 });
	}

	// The client sends both, so they must agree: the path is what gets written
	// to the repo and the entry is what was checked above.
	if (entry.filePath !== path) {
		return Response.json({ error: 'That page does not match its address' }, { status: 400 });
	}

	const summary =
		singleLine(typeof body.summary === 'string' ? body.summary : '', 72) ||
		`Delete ${path.replace('src/content/docs/', '')}`;

	try {
		const draft = await currentDraft(user.id);

		const existing = await readFile(path, draft.branch);
		if (!existing) {
			return Response.json({ error: 'That page has already been removed' }, { status: 409 });
		}

		await deleteFile({
			path,
			message: summary,
			branch: draft.branch,
			author: commitAuthor(user),
			sha: existing.sha,
		});

		const [, files] = await Promise.all([touchDraft(draft.id), changedFiles(draft.branch)]);

		return Response.json({ files });
	} catch (e) {
		if (e instanceof DraftLimitError) return Response.json({ error: e.message }, { status: 429 });
		console.error('[draft/delete]', e);
		return Response.json({ error: 'Could not delete that page' }, { status: 502 });
	}
};
