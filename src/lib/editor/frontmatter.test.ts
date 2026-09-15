// Run: npx tsx src/lib/editor/frontmatter.test.ts
import assert from 'node:assert/strict';
import { sidebarOrder, spliceContentFile, splitFrontmatter, yamlScalar } from './frontmatter.ts';

// --- splitting ---
assert.deepEqual(splitFrontmatter('---\ntitle: A\n---\n\nBody\n'), {
	yaml: 'title: A',
	body: 'Body\n',
});
assert.deepEqual(splitFrontmatter('No frontmatter here'), {
	yaml: '',
	body: 'No frontmatter here',
});
assert.equal(splitFrontmatter('---\ntitle: A\nnever closed').yaml, '', 'unterminated block');

// --- quoting only when YAML needs it ---
assert.equal(yamlScalar('Hex Prefixes (1/2/3-Byte)'), 'Hex Prefixes (1/2/3-Byte)');
assert.equal(yamlScalar('a: b'), '"a: b"', 'colon-space would start a mapping');
assert.equal(yamlScalar('- item'), '"- item"', 'leading dash would start a sequence');
assert.equal(yamlScalar('true'), '"true"', 'bare true would parse as a boolean');
assert.equal(yamlScalar('123'), '"123"', 'bare digits would parse as a number');
// Interior quotes need no quoting - YAML reads that as a plain scalar.
assert.equal(yamlScalar('say "hi"'), 'say "hi"');
// A leading quote does, and then the interior ones must be escaped.
assert.equal(yamlScalar('"quoted": yes'), '"\\"quoted\\": yes"');
assert.equal(yamlScalar(''), '""');

// --- THE POINT: unmanaged keys survive an edit ---
const rich = `---
title: Old Title
slug: custom-url
description: Old description
sidebar:
  order: 3
  label: Short
  badge: New
tableOfContents: false
head:
  - tag: meta
---

Old body.
`;

const out = spliceContentFile(rich, { title: 'New Title', description: 'New desc', order: 3 }, 'New body.');

assert.match(out, /^---\n/);
assert.match(out, /title: New Title/);
assert.match(out, /description: New desc/);
assert.match(out, /New body\./);
// Every key the editor does not manage must be byte-preserved.
for (const preserved of ['slug: custom-url', 'label: Short', 'badge: New', 'tableOfContents: false', '- tag: meta']) {
	assert.ok(out.includes(preserved), `must preserve ${preserved}`);
}
assert.ok(!out.includes('Old Title'), 'managed field replaced, not duplicated');
assert.ok(!out.includes('Old description'));
assert.ok(!out.includes('Old body'));
assert.equal(out.match(/^title:/gm)?.length, 1, 'exactly one title key');
assert.equal(out.match(/^sidebar:/gm)?.length, 1, 'exactly one sidebar key');

// --- ordering is stable, so edits do not reshuffle the block ---
assert.ok(out.indexOf('title:') < out.indexOf('slug:'), 'title keeps its original position');

// --- adding and removing sidebar.order ---
const noOrder = spliceContentFile('---\ntitle: A\n---\n\nB\n', { title: 'A', description: '', order: 5 }, 'B');
assert.match(noOrder, /sidebar:\n  order: 5/, 'order added when absent');

const dropped = spliceContentFile(rich, { title: 'T', description: '', order: null }, 'B');
assert.ok(!/order:/.test(dropped), 'order removed when cleared');
assert.ok(dropped.includes('label: Short'), 'siblings survive removing order');

const allGone = spliceContentFile('---\ntitle: A\nsidebar:\n  order: 2\n---\n\nB\n', { title: 'A', description: '', order: null }, 'B');
assert.ok(!/sidebar:/.test(allGone), 'empty sidebar block removed entirely');

// --- description cleared ---
const noDesc = spliceContentFile('---\ntitle: A\ndescription: D\n---\n\nB\n', { title: 'A', description: '  ', order: null }, 'B');
assert.ok(!/description:/.test(noDesc), 'blank description removed rather than left empty');

// --- idempotent: saving without editing changes nothing ---
const once = spliceContentFile(rich, { title: 'Old Title', description: 'Old description', order: 3 }, 'Old body.');
const twice = spliceContentFile(once, { title: 'Old Title', description: 'Old description', order: 3 }, 'Old body.');
assert.equal(once, twice, 'splicing is idempotent');

// --- order coercion: an empty field is not order 0 ---
// The editor sends null for an empty field and Number(null) is 0, which once
// injected `sidebar.order: 0` into every page saved without an order.
assert.equal(sidebarOrder(null), null, 'null is no order');
assert.equal(sidebarOrder(undefined), null, 'undefined is no order');
assert.equal(sidebarOrder(''), null, 'empty string is no order');
assert.equal(sidebarOrder('   '), null, 'blank string is no order');
assert.equal(sidebarOrder('abc'), null, 'non-numeric string is no order');
assert.equal(sidebarOrder({}), null, 'object is no order');
assert.equal(sidebarOrder(NaN), null, 'NaN is no order');
assert.equal(sidebarOrder(Infinity), null, 'Infinity is no order');
assert.equal(sidebarOrder(0), 0, 'a real zero is kept');
assert.equal(sidebarOrder(3), 3, 'a number is kept');
assert.equal(sidebarOrder('3'), 3, 'a numeric string is kept');
assert.equal(sidebarOrder(-1), -1, 'a negative order is kept');

// The whole point: an untouched page gains no sidebar block.
assert.equal(
	spliceContentFile('---\ntitle: A\n---\n\nB\n', { title: 'A', description: '', order: sidebarOrder(null) }, 'B'),
	'---\ntitle: A\n---\n\nB\n',
	'an empty order field leaves the file untouched',
);

console.log('frontmatter ok');
