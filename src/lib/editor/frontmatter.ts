// Splices an edit into an existing content file, server-side.
//
// The editor previously rebuilt the whole frontmatter block from the three
// fields its UI exposes, so every other key was deleted on save - `slug`,
// `sidebar.label`, `sidebar.badge`, `banner`, `head`, `prev`/`next`,
// `tableOfContents`. No editable page uses those today, so the loss was
// silent; the first page that did would have had its URL or sidebar entry
// quietly changed by an unrelated typo fix, and the diff would have looked
// deliberate to the moderator.
//
// So the file shape is decided here, from the file actually in the repository,
// rather than in the browser from a three-field whitelist. Keys the UI does
// not manage pass through verbatim - untouched bytes cannot be corrupted.

export type ManagedFields = {
	title: string;
	description: string;
	/** null removes sidebar.order. */
	order: number | null;
};

/**
 * Coerces the editor's sidebar-order field to `ManagedFields['order']`.
 *
 * `Number(null)` and `Number('')` are both 0, so coercing straight through
 * turned an empty order field into `sidebar.order: 0` and silently pinned the
 * page to the top of its group. Only a real number, or a string holding one,
 * is an order.
 */
export function sidebarOrder(raw: unknown): number | null {
	if (typeof raw === 'string' && raw.trim() === '') return null;
	if (typeof raw !== 'number' && typeof raw !== 'string') return null;
	const n = Number(raw);
	return Number.isFinite(n) ? n : null;
}

const FENCE = '---';

/** Splits a content file into its YAML block and the markdown after it. */
export function splitFrontmatter(file: string): { yaml: string; body: string } {
	const lines = file.split('\n');
	if (lines[0]?.trim() !== FENCE) return { yaml: '', body: file };

	const end = lines.indexOf(FENCE, 1);
	if (end === -1) return { yaml: '', body: file };

	return {
		yaml: lines.slice(1, end).join('\n'),
		body: lines
			.slice(end + 1)
			.join('\n')
			.replace(/^\n+/, ''),
	};
}

/**
 * Quotes only when YAML would otherwise misread the value. Frontmatter is
 * machine-written here but human-read in the diff, so unnecessary quoting is
 * noise a reviewer has to look past.
 */
export function yamlScalar(value: string): string {
	const v = value.trim();
	const needsQuoting =
		v === '' ||
		/^[-?:,[\]{}#&*!|>'"%@`]/.test(v) ||
		/:\s/.test(v) ||
		/\s#/.test(v) ||
		/^(true|false|null|yes|no|on|off|~)$/i.test(v) ||
		/^[-+]?[\d._]+$/.test(v);
	return needsQuoting ? `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : v;
}

/** True for a line opening a new top-level key, i.e. ending the previous one. */
const isTopLevelKey = (line: string) => /^[^\s#][^:]*:/.test(line);

/**
 * Rewrites one top-level key in place, preserving its position, or appends it
 * if absent. Any indented block the key owned is replaced along with it.
 */
function setTopLevel(lines: string[], key: string, rendered: string | null): string[] {
	const start = lines.findIndex((l) => l.startsWith(`${key}:`));
	if (start === -1) return rendered === null ? lines : [...lines, rendered];

	let end = start + 1;
	while (end < lines.length && !isTopLevelKey(lines[end]!)) end += 1;

	return [...lines.slice(0, start), ...(rendered === null ? [] : [rendered]), ...lines.slice(end)];
}

/** Renders the `sidebar:` block, keeping any sibling keys it already had. */
function renderSidebar(lines: string[], order: number | null): string | null {
	const start = lines.findIndex((l) => l.startsWith('sidebar:'));
	const siblings: string[] = [];

	if (start !== -1) {
		for (let i = start + 1; i < lines.length && !isTopLevelKey(lines[i]!); i += 1) {
			// Keep sidebar.label, sidebar.hidden, sidebar.badge and friends.
			if (!/^\s+order:/.test(lines[i]!)) siblings.push(lines[i]!);
		}
	}

	if (order === null && siblings.length === 0) return null;

	return ['sidebar:', ...(order === null ? siblings : [`  order: ${order}`, ...siblings])].join(
		'\n',
	);
}

/**
 * Produces the file to commit: managed fields updated, every other frontmatter
 * key preserved as written, and the edited body.
 */
export function spliceContentFile(original: string, fields: ManagedFields, body: string): string {
	const { yaml } = splitFrontmatter(original);
	let lines = yaml === '' ? [] : yaml.split('\n');

	lines = setTopLevel(lines, 'title', `title: ${yamlScalar(fields.title)}`);
	lines = setTopLevel(
		lines,
		'description',
		fields.description.trim() ? `description: ${yamlScalar(fields.description)}` : null,
	);
	lines = setTopLevel(lines, 'sidebar', renderSidebar(lines, fields.order));

	const cleanBody = body.replace(/^\n+/, '').replace(/\s*$/, '');
	return `${FENCE}\n${lines.join('\n')}\n${FENCE}\n\n${cleanBody}\n`;
}
