// Commit identity for a wiki contributor.
//
// Derived, never read off the user row: a Discord sign-in stores the person's
// real email address there, and git history is public and permanent. Deriving
// also keeps the domain one we control and have never registered on GitHub, so
// a commit can't be made to render as authored by someone else's account.
const ATTRIBUTION_DOMAIN = 'users.wiki.meshcore.kiwi';

/**
 * One rule for every user-supplied string that ends up on a single line of
 * permanent public output - a commit author, a commit subject, a PR title.
 *
 * Folds whitespace BEFORE stripping control characters: a newline is itself a
 * control character, so stripping first would weld two words together, while
 * folding turns the newline that would split a commit author line into a space.
 * The control strip also removes bidi overrides, which would otherwise let a
 * name reorder the text a moderator reads.
 */
export function singleLine(value: string | null | undefined, max: number): string {
	return (value ?? '')
		.replace(/\s+/g, ' ')
		.replace(/\p{C}/gu, '')
		.trim()
		.slice(0, max)
		.trim();
}

/**
 * Every sign-up path funnels through this. The result becomes the git commit
 * author on any page the person edits, so it is public and unremovable.
 * Normalises rather than rejects: throwing here would break sign-in itself,
 * and the sign-up form validates for the person's benefit before it gets here.
 *
 * 'Contributor' is a last-resort value for a NOT NULL column, nothing more.
 * Do not read it back as "this person never chose a name": it is
 * indistinguishable from someone who typed it, and account.astro used to nag
 * that person forever. A nullable column would express the difference
 * honestly, but better-auth declares this one NOT NULL and gen-auth-schema
 * compares against that, so the schema is not ours to change.
 */
export function normaliseDisplayName(name: string | null | undefined): string {
	const cleaned = singleLine(name, 50);
	return cleaned.length >= 2 ? cleaned : 'Contributor';
}

/**
 * Escapes text being interpolated into markdown we generate (the PR body).
 * Names and file paths legitimately contain `[`, backticks and `*`, so the
 * constraint belongs to the output format, not to the name - without this a
 * display name can render as a link in the PR a moderator is reading.
 */
export function escapeMarkdown(value: string): string {
	// Only characters that open inline markup. `.`, `-` and `#` are meaningful
	// at the start of a line, never mid-sentence, and escaping them would
	// mangle every URL and hyphenated name in the output.
	return value.replace(/[\\`*_[\]()<>|~]/g, '\\$&');
}

export function slug(name: string): string {
	const s = name
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.slice(0, 32)
		.replace(/^-+|-+$/g, '');
	return s || 'contributor';
}

export function commitAuthor(user: { id: string; name: string }) {
	return {
		// Re-applied here, not just at the database hook: this is the point of
		// consequence, and it is idempotent, so it holds however the row was
		// written (a seed, a d1 execute, a future admin tool).
		name: normaliseDisplayName(user.name),
		email: `${slug(user.name)}.${user.id.slice(0, 8)}@${ATTRIBUTION_DOMAIN}`,
	};
}
