// `?next=` comes from a URL, so it is attacker-controlled. Without this a link
// like /signin?next=https://evil.example would send someone through our own
// sign-in and straight off-site, with our domain in the address bar the whole
// way. Only same-origin, path-absolute targets are allowed.

const FALLBACK = '/';

export function safeRedirect(next: unknown, fallback: string = FALLBACK): string {
	if (typeof next !== 'string' || next === '') return fallback;

	// Must be path-absolute...
	if (!next.startsWith('/')) return fallback;
	// ...but not protocol-relative (//evil.example is a different origin).
	if (next.startsWith('//')) return fallback;
	// Backslashes are read as slashes by some parsers: /\evil.example
	if (next.includes('\\')) return fallback;
	// \p{Cc} is the control-character category - same job as the explicit range
	// in github/paths.ts, without writing control characters into the source.
	if (/\p{Cc}/u.test(next)) return fallback;
	// A scheme cannot legitimately appear in a path-absolute URL.
	if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(next)) return fallback;

	return next;
}
