// Loaded only when someone clicks Edit. Everything heavy - Crepe (which brings
// Vue), CodeMirror, the theme CSS - lives in this chunk so a reader who never
// edits never downloads it.
import { Crepe } from '@milkdown/crepe';
import { remarkStringifyOptionsCtx } from '@milkdown/kit/core';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
// Structural styles only. Crepe's palette files (frame.css and friends) are
// nothing but --crepe-* custom properties, so instead of shipping theirs and
// swapping it on theme change, custom.css maps those variables onto the Six
// theme's tokens - one definition that is already correct in both modes.
// As ?url, not a plain CSS import: Vite hoists CSS reachable through a dynamic
// import into the IMPORTING page's stylesheet set, so a plain import here put
// 83 KB of ProseMirror selectors in the <head> of every prerendered page.
// Fetching the stylesheets when the editor opens is the whole point of the
// chunk being lazy.
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

export type OpenOptions = {
	entryId: string;
	filePath: string;
	rawOnly: boolean;
};

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
	// The panel's presence in the DOM already records that the editor is open;
	// a module flag was a second copy of that fact which stayed true if setup
	// threw, latching the editor shut until a reload.
	if (document.querySelector('.wiki-editor')) return;

	loadStyles();

	const res = await fetch(`/api/page?id=${encodeURIComponent(options.entryId)}`);

	// Signed out: send them to sign in and come back with the editor open,
	// rather than telling them off in a browser dialog.
	if (res.status === 401) {
		const back = `${location.pathname}?edit=1`;
		location.href = `/signin?next=${encodeURIComponent(back)}`;
		return;
	}
	if (!res.ok) {
		showToast(`Could not open the editor: ${res.status} ${await res.text()}`);
		return;
	}
	const source = (await res.json()) as PageSource;

	const panel = buildPanel(options, source);

	let crepe: Crepe | null = null;
	let raw: EditorView | null = null;
	// The single source of truth while switching modes: whichever editor is
	// live owns the text, and this holds it in between.
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
		// Match the conventions already in src/content/docs so a one-word fix
		// does not arrive as a diff touching every list and table in the file.
		// Shared with scripts/normalise-content.mjs - see format.ts.
		crepe.editor.config((ctx) => {
			ctx.set(remarkStringifyOptionsCtx, {
				...ctx.get(remarkStringifyOptionsCtx),
				...STRINGIFY_OPTIONS,
			});
		});
		// Teaches Milkdown the `:::aside` syntax. Without it, directives round
		// -tripped as escaped plain text and broke the aside.
		crepe.editor.use(directivePlugins);
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
		panel.say('Saving...');
		try {
			const data = await postJson<{ unchanged?: boolean; files?: PendingFile[] }>(
				'/api/draft/save',
				{
					path: options.filePath,
					frontmatter: panel.frontmatter(),
					body: currentMarkdown(),
					summary: panel.summary(),
				},
			);

			panel.showPending(data.files ?? []);
			panel.say(
				data.unchanged
					? 'No changes to save.'
					: 'Saved to your draft. Add more pages, then submit for review.',
			);
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

	await (options.rawOnly ? toRaw() : toRich());
}





/**
 * Errors before the panel exists have nowhere to live, so this is the one
 * fallback surface. Deliberately not `alert()`: a modal browser dialog blocks
 * the page and looks like a fault in the site.
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
