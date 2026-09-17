// Lazy chunk: Crepe (which brings Vue), CodeMirror and the theme CSS load only
// when someone clicks Edit.
import { Crepe } from '@milkdown/crepe';
import { remarkStringifyOptionsCtx } from '@milkdown/kit/core';
import { remarkPreserveEmptyLinePlugin } from '@milkdown/kit/preset/commonmark';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
// Structural styles only - custom.css maps the --crepe-* properties onto the
// Six theme's tokens, so Crepe's own palette files are not shipped.
// `?url` is load-bearing: Vite hoists CSS reachable through a dynamic import
// into the importing page's stylesheet set, putting 83 KB of ProseMirror
// selectors in the <head> of every prerendered page.
import crepeStyles from '@milkdown/crepe/theme/common/style.css?url';
import editorStyles from '../../styles/editor.css?url';
import { buildPanel } from './panel';
import { directivePlugins } from './directive';
import { STRINGIFY_OPTIONS } from './format';

export type PendingFile = { path: string; status: string };

/** POSTs JSON and throws the server's own error message on failure. */
async function postJson<T>(url: string, body: unknown): Promise<T> {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
	const data = (await res.json().catch(() => ({}))) as T & { error?: string };
	if (!res.ok) throw new Error(data.error ?? `${url} failed (${res.status})`);
	return data;
}

export type OpenOptions =
	| { entryId: string; filePath: string; rawOnly: boolean }
	/** Creating a page: there is nothing to fetch and no path yet. */
	| { create: true };

type PageSource = {
	filePath: string;
	body: string;
	frontmatter: { title: string; description: string; order: number | null };
};

/** Injected once, on first open. */
function loadStyles() {
	for (const href of [crepeStyles, editorStyles]) {
		if (document.querySelector(`link[href="${href}"]`)) continue;
		document.head.append(
			Object.assign(document.createElement('link'), { rel: 'stylesheet', href }),
		);
	}
}

export async function openEditor(options: OpenOptions) {
	// The DOM is the open/closed flag; a module-level one latched shut when
	// setup threw.
	if (document.querySelector('.wiki-editor')) return;

	loadStyles();

	const creating = 'create' in options;

	// Creating needs the section list; editing needs the page itself.
	const res = await fetch(
		creating ? '/api/sections' : `/api/page?id=${encodeURIComponent(options.entryId)}`,
	);

	if (res.status === 401) {
		const back = `${location.pathname}?${creating ? 'new' : 'edit'}=1`;
		location.href = `/signin?next=${encodeURIComponent(back)}`;
		return;
	}
	if (!res.ok) {
		showToast(`Could not open the editor: ${res.status} ${await res.text()}`);
		return;
	}

	const payload = await res.json();

	const source: PageSource = creating
		? {
				filePath: 'src/content/docs/...',
				body: '',
				frontmatter: { title: '', description: '', order: null },
			}
		: (payload as PageSource);

	const panel = buildPanel(
		creating ? { filePath: '', rawOnly: false, create: payload as { sections: string[] } } : options,
		source,
	);

	let crepe: Crepe | null = null;
	let raw: EditorView | null = null;
	// Holds the text between modes; whichever editor is live owns it otherwise.
	let markdownText = source.body;

	const isDark = () => document.documentElement.dataset.theme === 'dark';

	async function toRich() {
		if (raw) {
			markdownText = raw.state.doc.toString();
			raw.destroy();
			raw = null;
		}
		panel.richHost.hidden = false;
		panel.rawHost.hidden = true;
		crepe = new Crepe({ root: panel.richHost, defaultValue: markdownText });
		// Shared with scripts/normalise-content.mjs so a one-word fix does not
		// reformat every table in the file - see format.ts.
		crepe.editor.config((ctx) => {
			ctx.set(remarkStringifyOptionsCtx, {
				...ctx.get(remarkStringifyOptionsCtx),
				...STRINGIFY_OPTIONS,
			});
		});
		// Without this, `:::aside` round-trips as escaped plain text.
		crepe.editor.use(directivePlugins);
		// Milkdown writes `<br />` for every empty paragraph that is not the
		// last node, so blank table cells came back as `<br />`.
		await crepe.editor.remove(remarkPreserveEmptyLinePlugin);
		await crepe.create();
	}

	async function toRaw() {
		if (crepe) {
			markdownText = crepe.getMarkdown();
			await crepe.destroy();
			crepe = null;
		}
		panel.richHost.hidden = true;
		panel.rawHost.hidden = false;
		panel.rawHost.replaceChildren();
		raw = new EditorView({
			doc: markdownText,
			parent: panel.rawHost,
			extensions: [basicSetup, markdown(), ...(isDark() ? [oneDark] : [])],
		});
	}

	/** The markdown as it stands, whichever mode is active. */
	const currentMarkdown = () =>
		raw ? raw.state.doc.toString() : crepe ? crepe.getMarkdown() : markdownText;

	panel.onMode(async (mode) => (mode === 'rich' ? toRich() : toRaw()));

	panel.onClose(async () => {
		await crepe?.destroy();
		raw?.destroy();
		panel.remove();
	});

	panel.onSave(async () => {
		const target = panel.target();

		// Caught here so the message points at the field, not at the request.
		if (target && !target.slug) {
			panel.say('Give the page a title, or type an address for it.', 'error');
			return;
		}

		panel.say('Saving...');
		try {
			const data = await postJson<{ unchanged?: boolean; files?: PendingFile[] }>(
				'/api/draft/save',
				target
					? {
							create: true,
							section: target.section,
							slug: target.slug,
							frontmatter: panel.frontmatter(),
							body: currentMarkdown(),
							summary: panel.summary(),
						}
					: {
							path: (options as { filePath: string }).filePath,
							frontmatter: panel.frontmatter(),
							body: currentMarkdown(),
							summary: panel.summary(),
						},
			);

			panel.showPending(data.files ?? []);
			panel.say(
				data.unchanged
					? 'No changes to save.'
					: target
						? `Saved to your draft. It will live at ${panel.publicUrl()} once a moderator merges it.`
						: 'Saved to your draft. Add more pages, then submit for review.',
			);
		} catch (e) {
			panel.say(e instanceof Error ? e.message : String(e), 'error');
		}
	});

	panel.onDelete(async () => {
		panel.say('Deleting...');
		try {
			const data = await postJson<{ files?: PendingFile[] }>('/api/draft/delete', {
				entryId: (options as { entryId: string }).entryId,
				path: (options as { filePath: string }).filePath,
				summary: panel.summary(),
			});
			panel.showPending(data.files ?? []);
			panel.say('Queued for deletion. Submit for review when you are ready.');
		} catch (e) {
			panel.say(e instanceof Error ? e.message : String(e), 'error');
		}
	});

	panel.onSubmit(async () => {
		const title = panel.summary().trim();
		if (!title) {
			panel.say('Describe your change for the moderator before submitting.', 'error');
			panel.focusSummary();
			return;
		}

		panel.say('Submitting...');
		try {
			const { number } = await postJson<{ number: number }>('/api/draft/submit', { title });
			panel.say(`Submitted as pull request #${number}. A moderator will review it.`);
			panel.showPending([]);
		} catch (e) {
			panel.say(e instanceof Error ? e.message : String(e), 'error');
		}
	});

	// Show anything already queued from earlier edits in this draft.
	void fetch('/api/draft')
		.then((r) => (r.ok ? (r.json() as Promise<{ files?: PendingFile[] }>) : null))
		.catch(() => null)
		.then((d) => {
			panel.showPending(d?.files ?? []);
			if (d?.files?.length) panel.say(`${d.files.length} page(s) already in your draft.`);
		});

	await (!creating && options.rawOnly ? toRaw() : toRich());
}





/**
 * Fallback surface for errors raised before the panel exists. Not `alert()`:
 * a modal browser dialog looks like a fault in the site.
 */
function showToast(message: string) {
	const existing = document.querySelector('.wiki-toast');
	existing?.remove();

	const toast = document.createElement('div');
	toast.className = 'wiki-toast not-content';
	toast.setAttribute('role', 'alert');
	toast.textContent = message;

	const dismiss = document.createElement('button');
	dismiss.type = 'button';
	dismiss.textContent = 'Dismiss';
	dismiss.addEventListener('click', () => toast.remove());
	toast.append(dismiss);

	document.body.append(toast);
	setTimeout(() => toast.remove(), 8000);
}
