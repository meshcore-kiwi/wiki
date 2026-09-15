// Run: npx tsx src/lib/github/paths.test.ts
import assert from 'node:assert/strict';
import { assertContentPath, draftBranch, UnsafePathError } from './paths.ts';

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

console.log('paths ok');
