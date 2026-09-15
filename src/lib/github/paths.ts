// The only thing standing between a contributor and the rest of the repo.
//
// The bot's token can write anywhere in the repository, so the path a
// contributor supplies must be constrained here rather than trusted. Without
// this, a crafted request could commit to astro.config.mjs, package.json, or
// the auth code. (Workflows are additionally safe because the App was created
// without the Workflows permission, but that is a second line of defence, not
// this one.)

const ROOT = 'src/content/docs/';
const ALLOWED_EXTENSIONS = ['.md', '.mdx'];

export class UnsafePathError extends Error {}

/**
 * Returns the path unchanged if a contributor may write it, and throws
 * otherwise. Rejects rather than sanitises: a path that needs cleaning up is a
 * path we did not expect, and quietly rewriting it hides that.
 */
export function assertContentPath(path: unknown): string {
	if (typeof path !== 'string' || path === '') {
		throw new UnsafePathError('No file path given');
	}

	// Reject before normalising, so nothing can be smuggled through decoding.
	if (path !== path.normalize('NFC')) {
		throw new UnsafePathError('Path must be NFC-normalised');
	}
	if (/[\u0000-\u001f\\]/.test(path)) {
		throw new UnsafePathError('Path contains control characters or backslashes');
	}
	if (path.startsWith('/') || /^[a-zA-Z]:/.test(path)) {
		throw new UnsafePathError('Path must be relative to the repository root');
	}
	if (path.split('/').some((segment) => segment === '..' || segment === '.' || segment === '')) {
		throw new UnsafePathError('Path must not contain traversal or empty segments');
	}
	if (!path.startsWith(ROOT)) {
		throw new UnsafePathError(`Only files under ${ROOT} can be edited`);
	}
	if (!ALLOWED_EXTENSIONS.some((ext) => path.endsWith(ext))) {
		throw new UnsafePathError(`Only ${ALLOWED_EXTENSIONS.join(' and ')} files can be edited`);
	}
	// `src/content/docs/.md` would pass the checks above but is not a page.
	const name = path.slice(ROOT.length);
	if (name.startsWith('.') || name.includes('/.')) {
		throw new UnsafePathError('Path must not contain dotfiles');
	}

	return path;
}

/** Branch name for one contributor's draft. Never built from user input. */
export function draftBranch(userId: string, draftId: string): string {
	return `wiki/${userId}/${draftId}`;
}
