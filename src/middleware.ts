import { defineMiddleware } from 'astro:middleware';
import { createAuth } from './lib/auth';

export const onRequest = defineMiddleware(async (ctx, next) => {
	ctx.locals.user = null;

	// Prerendered routes run this at build time, where there is no request to
	// read a session from and no D1 binding to read it with.
	if (ctx.isPrerendered) return next();

	// better-auth's own catch-all builds a second auth instance and resolves
	// the session itself, and never reads locals.user - so doing it here too
	// doubles the work on the busiest authenticated path.
	if (ctx.url.pathname.startsWith('/api/auth/')) return next();

	const session = await createAuth().api.getSession({ headers: ctx.request.headers });
	ctx.locals.user = session?.user ?? null;

	return next();
});
