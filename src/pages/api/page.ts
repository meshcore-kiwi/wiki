import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';

export const prerender = false;

// Serves the raw markdown behind a page. Fetched when the editor opens rather
// than embedded in every page, so readers do not download the source of a page
// they are only reading.
//
// ponytail: reads the built collection, i.e. whatever is on main. Once a draft
// can span several pages, re-opening a page already in your draft must read
// your branch instead - swap this for a GitHub contents read at that point.
export const GET: APIRoute = async (ctx) => {
	if (!ctx.locals.user) return new Response('Sign in to edit', { status: 401 });

	const id = new URL(ctx.request.url).searchParams.get('id');
	if (!id) return new Response('Missing id', { status: 400 });

	const entry = await getEntry('docs', id);
	if (!entry) return new Response('No such page', { status: 404 });

	const { title, description, sidebar } = entry.data;

	return Response.json({
		filePath: entry.filePath,
		body: entry.body ?? '',
		frontmatter: { title, description: description ?? '', order: sidebar?.order ?? null },
	});
};
