import type { APIRoute } from 'astro';
import { escapeMarkdown, singleLine } from '../../../lib/attribution';
import { markSubmitted, openDraftFor } from '../../../lib/drafts';
import { changedFiles, openPullRequest } from '../../../lib/github/client';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
	const user = ctx.locals.user;
	if (!user) return Response.json({ error: 'Sign in to submit' }, { status: 401 });

	const body = (await ctx.request.json().catch(() => null)) as { title?: unknown } | null;

	const draft = await openDraftFor(user.id);
	if (!draft) return Response.json({ error: 'Nothing to submit' }, { status: 400 });

	const files = await changedFiles(draft.branch);
	if (files.length === 0) {
		return Response.json({ error: 'This draft has no changes yet' }, { status: 400 });
	}

	const title =
		singleLine(typeof body?.title === 'string' ? body.title : '', 100) ||
		`Wiki edit: ${files.length} page${files.length === 1 ? '' : 's'}`;

	// Who submitted this matters to the moderator and cannot be read off the
	// PR author, which is the app. Both the name and the paths are
	// contributor-controlled and land in markdown, so both are escaped - an
	// unescaped name can render as a link in the PR body.
	const prBody = [
		`Submitted from the wiki editor by **${escapeMarkdown(user.name)}** (wiki user \`${user.id}\`).`,
		'',
		'Pages changed:',
		...files.map((f) => `- \`${escapeMarkdown(f.path)}\` (${f.status})`),
	].join('\n');

	try {
		const pr = await openPullRequest({ head: draft.branch, title, body: prBody });
		await markSubmitted(draft.id, pr.number, title);
		return Response.json({ number: pr.number, url: pr.url });
	} catch (e) {
		console.error('[draft/submit]', e);
		return Response.json({ error: 'Could not open the pull request' }, { status: 502 });
	}
};
