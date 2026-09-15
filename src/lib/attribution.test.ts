// Run: npx tsx src/lib/attribution.test.ts
import assert from 'node:assert/strict';
import { commitAuthor, escapeMarkdown, normaliseDisplayName, singleLine, slug } from './attribution.ts';

assert.equal(slug('Jane Smith'), 'jane-smith');
assert.equal(slug('Tāmati Ō'), 'tamati-o', 'macrons fold to ASCII');
assert.equal(slug('  !!!  '), 'contributor', 'empty slug falls back');
assert.equal(slug('a'.repeat(50)).length, 32, 'slug is capped');
assert.ok(!slug('x'.repeat(31) + ' y').endsWith('-'), 'no trailing dash after the cap');

// The whole point: a real address on the row never reaches the commit.
const author = commitAuthor({ id: '3f9a2c1b-dead-beef-0000-000000000000', name: 'Jane Smith' });
assert.equal(author.email, 'jane-smith.3f9a2c1b@users.wiki.meshcore.kiwi');
assert.ok(author.email.endsWith('@users.wiki.meshcore.kiwi'), 'domain is one we control');

// Display names are user-supplied and end up in public git history.
assert.equal(normaliseDisplayName('  Jane   Smith  '), 'Jane Smith');
assert.equal(normaliseDisplayName('Jane\nSmith'), 'Jane Smith', 'no newline can split a commit author line');
assert.equal(normaliseDisplayName('Jane\u0000Smith'), 'JaneSmith', 'control characters are stripped');
assert.equal(normaliseDisplayName('x'), 'Contributor', 'too short falls back');
assert.equal(normaliseDisplayName(null), 'Contributor');
assert.equal(normaliseDisplayName('a'.repeat(80)).length, 50, 'capped at 50');
assert.ok(!normaliseDisplayName('a'.repeat(49) + ' bbb').endsWith(' '), 'no trailing space after the cap');

// singleLine is the shared rule behind display names, commit subjects and PR
// titles, so the caps are per-caller.
assert.equal(singleLine('  a   b  ', 50), 'a b');
assert.equal(singleLine('a'.repeat(80), 72).length, 72);
assert.equal(singleLine(null, 10), '');
// Bidi overrides would let a name reorder text a moderator reads.
assert.equal(singleLine('safe\u202Eevil', 50), 'safeevil', 'bidi override stripped');

// Untrusted text entering markdown we generate must not become markup.
assert.equal(escapeMarkdown('a](https://evil.example)'), 'a\\]\\(https://evil.example\\)');
assert.equal(escapeMarkdown('src/content/docs/a-b.md'), 'src/content/docs/a-b.md', 'paths stay readable');
assert.equal(escapeMarkdown('**bold**'), '\\*\\*bold\\*\\*');
assert.equal(escapeMarkdown('plain name'), 'plain name');

console.log('attribution ok');
