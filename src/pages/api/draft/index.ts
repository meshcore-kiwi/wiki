import type { APIRoute } from 'astro';
import { openDraftFor } from '../../../lib/drafts';
import { changedFiles } from '../../../lib/github/client';

export const prerender = false;

/** The contributor's pending draft, so the editor can show what is queued. */
export const GET: APIRoute = async (ctx) => {
	const user = ctx.locals.user;
	if (!user) return Response.json({ error: 'Sign in' }, { status: 401 });

	const draft = await openDraftFor(user.id);
	if (!draft) return Response.json({ draft: null, files: [] });

	return Response.json({
		draft: { id: draft.id, branch: draft.branch, createdAt: draft.createdAt },
		files: await changedFiles(draft.branch),
	});
};
