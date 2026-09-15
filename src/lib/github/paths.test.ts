// Run: npx tsx src/lib/github/paths.test.ts
import assert from 'node:assert/strict';
import {
	assertContentPath,
	contentPathFor,
	draftBranch,
	slugify,
	UnsafePathError,
} from './paths.ts';

const ok = (p: string) => assert.equal(assertContentPath(p), p, `should allow ${p}`);
const no = (p: unknown, why: string) =>
	assert.throws(() => assertContentPath(p as string), UnsafePathError, `should reject ${why}`);

// --- allowed ---
ok('src/content/docs/index.mdx');
ok('src/content/docs/getting-started.md');
ok('src/content/docs/guides/hex-prefixes.md');
ok('src/content/docs/a/b/c/deep.md');

// --- escaping the content directory ---
no('src/content/docs/../../../astro.config.mjs', 'traversal to config');
no('src/content/docs/../../pages/api/auth/[...all].ts', 'traversal to auth code');
no('astro.config.mjs', 'repo root file');
no('package.json', 'manifest');
no('.github/workflows/ci.yml', 'workflow');
no('src/content/docs/../docs/x.md', 'traversal that lands back inside');
no('/etc/passwd', 'absolute path');
no('C:/windows/system.ini', 'windows absolute path');
no('src/content/docs\\..\\..\\x.md', 'backslash traversal');

// --- wrong file types ---
no('src/content/docs/evil.ts', 'typescript file');
no('src/content/docs/evil.js', 'javascript file');
no('src/content/docs/.env', 'dotfile');
no('src/content/docs/sub/.hidden.md', 'nested dotfile');
no('src/content/docs/notmarkdown', 'no extension');

// --- degenerate input ---
no('', 'empty string');
no(undefined, 'undefined');
no(null, 'null');
no(42, 'a number');
no('src/content/docs//x.md', 'empty path segment');
no('src/content/docs/./x.md', 'single-dot segment');
no('src/content/docs/x\u0000.md', 'null byte');

// A prefix match alone must not be enough to escape the directory.
no('src/content/docsx/evil.md', 'sibling directory sharing the prefix');

assert.equal(draftBranch('abc123', 'q7'), 'wiki/abc123/q7');


// --- composing a new page's path ---
assert.equal(contentPathFor('guides', 'antenna-basics'), 'src/content/docs/guides/antenna-basics.md');
assert.equal(contentPathFor('', 'about'), 'src/content/docs/about.md');
assert.equal(contentPathFor('  guides  ', ' antenna-basics '), 'src/content/docs/guides/antenna-basics.md');

for (const [section, slug, why] of [
	['..', 'x', 'traversal as a section'],
	['guides', '../../evil', 'traversal as a slug'],
	['guides/nested', 'x', 'nested section'],
	['Guides', 'x', 'uppercase section'],
	['guides', 'Antenna_Basics', 'underscore and uppercase slug'],
	['guides', '', 'empty slug'],
	['guides', '-leading', 'leading hyphen'],
	['guides', 'trailing-', 'trailing hyphen'],
	['guides', 'double--hyphen', 'doubled hyphen'],
	['guides', '.hidden', 'dotfile'],
	['guides', 'page.mdx', 'mdx cannot be created here'],
] as Array<[unknown, unknown, string]>) {
	assert.throws(() => contentPathFor(section, slug), UnsafePathError, why as string);
}

// A missing section means top level, which is a real place for a page to live.
// The slug is validated either way, so this is lenient without being loose.
assert.equal(contentPathFor(undefined, 'about'), 'src/content/docs/about.md');
assert.equal(contentPathFor(null, 'about'), 'src/content/docs/about.md');
assert.throws(() => contentPathFor(undefined, undefined), UnsafePathError, 'but a missing slug is not');

// slugify only suggests; the result is validated either way.
assert.equal(slugify('Antenna Basics (2.4 GHz)'), 'antenna-basics-2-4-ghz');
assert.equal(slugify('  Hex Prefixes!  '), 'hex-prefixes');
assert.equal(slugify('///'), '');
assert.throws(() => contentPathFor('guides', slugify('///')), UnsafePathError, 'empty slugify output still rejected');

console.log('paths ok');
