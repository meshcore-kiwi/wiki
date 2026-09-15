// Run: npx tsx src/lib/safe-redirect.test.ts
import assert from 'node:assert/strict';
import { safeRedirect } from './safe-redirect.ts';

// --- allowed ---
assert.equal(safeRedirect('/guides/hex-prefixes/'), '/guides/hex-prefixes/');
assert.equal(safeRedirect('/guides/hex-prefixes/?edit=1'), '/guides/hex-prefixes/?edit=1');
assert.equal(safeRedirect('/a/b#frag'), '/a/b#frag');

// --- off-site, which is the whole point ---
assert.equal(safeRedirect('https://evil.example'), '/');
assert.equal(safeRedirect('//evil.example'), '/', 'protocol-relative is another origin');
assert.equal(safeRedirect('/\\evil.example'), '/', 'backslash reads as a slash to some parsers');
assert.equal(safeRedirect('\\\\evil.example'), '/');
assert.equal(safeRedirect('javascript:alert(1)'), '/');
assert.equal(safeRedirect('/javascript:alert(1)'), '/', 'scheme inside a path-absolute URL');
assert.equal(safeRedirect('data:text/html,x'), '/');

// --- control characters ---
assert.equal(safeRedirect(`/x${String.fromCodePoint(0)}y`), '/', 'null byte');
assert.equal(safeRedirect(`/x${String.fromCodePoint(10)}y`), '/', 'newline');
assert.equal(safeRedirect(`/x${String.fromCodePoint(13)}y`), '/', 'carriage return');
assert.equal(safeRedirect(`/x${String.fromCodePoint(127)}y`), '/', 'delete');

// --- degenerate input ---
assert.equal(safeRedirect(''), '/');
assert.equal(safeRedirect(undefined), '/');
assert.equal(safeRedirect(null), '/');
assert.equal(safeRedirect(42), '/');
assert.equal(safeRedirect('relative/path'), '/', 'must be path-absolute');

// --- fallback is honoured ---
assert.equal(safeRedirect('/ok', '/account'), '/ok');
assert.equal(safeRedirect('bad', '/account'), '/account');

console.log('safe-redirect ok');
