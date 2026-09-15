// The single definition of how this project writes markdown.
//
// Both the browser editor (mount.ts) and the offline normaliser
// (scripts/normalise-content.mjs) must emit byte-identical output, or a
// contributor's one-word fix arrives as a diff touching every table in the
// file. These were previously copy-pasted into both and had already drifted -
// the editor set table options the script did not.
//
// Deliberately free of DOM and Worker imports so both runtimes can load it.

/**
 * Only the options that differ from remark-stringify's defaults. Everything
 * else must stay at the default, because that is what Milkdown emits - an
 * extra override here creates the very mismatch this module exists to remove.
 * (`emphasis: '_'` was such a mistake: it rewrote `*text*` to `_text_`, which
 * the editor then rewrote straight back.)
 *
 * `tablePipeAlign` and `tableCellPadding` used to be set here too. They are
 * remark-gfm options, not stringify options, so they were silently ignored -
 * verified by round-tripping every page in src/content/docs and seeing tables
 * come back padded regardless. Dead config, removed rather than propagated.
 */
export const STRINGIFY_OPTIONS = {
	bullet: '-',
} as const;

/**
 * remark-stringify escapes `&` inside link destinations in case it starts a
 * character reference. `\&` re-parses to `&` so the link still works, but it
 * dirties every diff for no benefit, and mdast-util-to-markdown has no
 * supported option to disable it - its `unsafe` patterns are additive. So this
 * is post-processing by necessity, narrowed to link destinations so escapes in
 * prose, where they may be deliberate, are left alone.
 */
export function unescapeLinkAmpersands(markdown: string): string {
	return markdown.replace(/\]\(([^)]*)\)/g, (whole, url: string) =>
		url.includes('\\&') ? `](${url.replace(/\\&/g, '&')})` : whole,
	);
}
