import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';

export const prerender = false;

export const ALL: APIRoute = (ctx) => {
	// ctx.request.headers is immutable, so pass a copy - better-auth reads
	// x-forwarded-for for its rate limiting.
	const headers = new Headers(ctx.request.headers);
	headers.set('x-forwarded-for', ctx.clientAddress);

	return createAuth().handler(new Request(ctx.request, { headers }));
};
