// Rewrites src/content/docs/*.md into the exact form the browser editor emits,
// so a contributor's one-word fix arrives as a one-line diff instead of a
// reformat of every table in the file.
//
// Uses the same remark stack and the same stringify options as the editor
// (see src/lib/editor/mount.ts and directive.ts), so the two agree by
// construction rather than by luck.
//
// Run: npm run normalise-content   (idempotent - safe to re-run)
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
// Same module the browser editor uses, so the two cannot drift.
import { STRINGIFY_OPTIONS, unescapeLinkAmpersands } from '../src/lib/editor/format.ts';

const processor = unified()
	.use(remarkParse)
	.use(remarkFrontmatter, ['yaml'])
	.use(remarkGfm)
	.use(remarkDirective)
	.use(remarkStringify, STRINGIFY_OPTIONS);

// .mdx is excluded: it is JSX under the markdown and this stack would mangle it.
const files = globSync('src/content/docs/**/*.md');
let changed = 0;

for (const file of files) {
	const before = readFileSync(file, 'utf8');
	let after = String(processor.processSync(before));

	after = unescapeLinkAmpersands(after);

	if (after !== before) {
		writeFileSync(file, after);
		changed += 1;
		console.log(`  rewrote ${file}`);
	}
}

console.log(`${changed} of ${files.length} file(s) changed`);
