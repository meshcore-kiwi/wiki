// Builds the editor panel's DOM. Kept apart from mount.ts so the editor logic
// is not buried in markup construction.
import type { PendingFile } from './mount';

type Frontmatter = { title: string; description: string; order: number | null };

type Source = { filePath: string; frontmatter: Frontmatter };

export function buildPanel(options: { filePath: string; rawOnly: boolean }, source: Source) {
	// A modal <dialog> for the three things a hand-rolled panel had to fake:
	// a focus trap, Escape to close, and the top layer (so nothing on the page
	// can overlap it). The browser also returns focus to the Edit button.
	const el = document.createElement('dialog');
	el.className = 'wiki-editor not-content';
	el.innerHTML = `
		<header class="wiki-editor-bar">
			<div>
				<strong>Editing</strong>
				<code>${escapeHtml(source.filePath)}</code>
			</div>
			<div class="wiki-editor-actions">
				<div class="wiki-editor-modes" role="group" aria-label="Editor mode">
					<button type="button" data-mode="rich" aria-pressed="true"${options.rawOnly ? ' disabled title="MDX pages contain components and can only be edited as raw markdown"' : ''}>Rich</button>
					<button type="button" data-mode="raw" aria-pressed="false">Markdown</button>
				</div>
				<button type="button" class="auth-btn" data-action="save">Save to draft</button>
				<button type="button" class="auth-btn" data-action="submit">Submit for review</button>
				<button type="button" class="auth-btn" data-variant="secondary" data-action="close">Close</button>
			</div>
		</header>

		<div class="wiki-editor-meta">
			<label>Title<input type="text" data-fm="title" value="${escapeHtml(source.frontmatter.title)}" maxlength="120" /></label>
			<label>Description<input type="text" data-fm="description" value="${escapeHtml(source.frontmatter.description)}" maxlength="200" /></label>
			<label>Sidebar order<input type="number" data-fm="order" value="${source.frontmatter.order ?? ''}" /></label>
		</div>

		<div class="wiki-editor-body">
			<div data-host="rich"></div>
			<div data-host="raw" hidden></div>
		</div>

		<div class="wiki-editor-summary">
			<label>
				What did you change?
				<input type="text" data-summary maxlength="100" placeholder="e.g. Corrected the 2-byte firmware minimum" value="" />
			</label>
		</div>

		<footer class="wiki-editor-status">
			<p data-status role="status"></p>
			<ul data-pending hidden></ul>
		</footer>
	`;
	document.body.append(el);
	el.showModal();

	const $ = <T extends HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
	const modeButtons = [...el.querySelectorAll<HTMLButtonElement>('[data-mode]')];
	const status = $<HTMLParagraphElement>('[data-status]');
	const pending = $<HTMLUListElement>('[data-pending]');
	const summaryInput = $<HTMLInputElement>('[data-summary]');
	const buttons = {
		save: $<HTMLButtonElement>('[data-action="save"]'),
		submit: $<HTMLButtonElement>('[data-action="submit"]'),
	};

	return {
		richHost: $<HTMLDivElement>('[data-host="rich"]'),
		rawHost: $<HTMLDivElement>('[data-host="raw"]'),

		frontmatter(): Frontmatter {
			const order = $<HTMLInputElement>('[data-fm="order"]').value.trim();
			return {
				title: $<HTMLInputElement>('[data-fm="title"]').value,
				description: $<HTMLInputElement>('[data-fm="description"]').value,
				order: order === '' ? null : Number(order),
			};
		},

		onMode(handler: (mode: 'rich' | 'raw') => void | Promise<void>) {
			for (const button of modeButtons) {
				button.addEventListener('click', async () => {
					if (button.disabled || button.getAttribute('aria-pressed') === 'true') return;
					for (const b of modeButtons) b.setAttribute('aria-pressed', String(b === button));
					await handler(button.dataset.mode as 'rich' | 'raw');
				});
			}
		},

		summary: () => summaryInput.value,
		focusSummary: () => summaryInput.focus(),

		onSave(handler: () => void | Promise<void>) {
			buttons.save.addEventListener('click', () => run(buttons.save, handler));
		},

		onSubmit(handler: () => void | Promise<void>) {
			buttons.submit.addEventListener('click', () => run(buttons.submit, handler));
		},

		onClose(handler: () => void) {
			$('[data-action="close"]').addEventListener('click', handler);
			// Escape and the backdrop both fire 'cancel' rather than clicking
			// Close, so route them through the same teardown.
			el.addEventListener('cancel', (e) => {
				e.preventDefault();
				handler();
			});
		},

		say(message: string, tone: 'info' | 'error' = 'info') {
			status.textContent = message;
			status.dataset.tone = tone;
		},

		/** Renders the pages queued in the draft, so multi-page edits are visible. */
		showPending(files: PendingFile[]) {
			pending.replaceChildren(
				...files.map((f) => {
					const li = document.createElement('li');
					li.textContent = `${f.path} (${f.status})`;
					return li;
				}),
			);
			pending.hidden = files.length === 0;
			buttons.submit.disabled = files.length === 0;
		},

		remove: () => {
			el.close();
			el.remove();
		},
	};
}

/** Disables the button while its action runs and surfaces any failure. */
async function run(button: HTMLButtonElement, handler: () => void | Promise<void>) {
	button.disabled = true;
	try {
		await handler();
	} finally {
		button.disabled = false;
	}
}

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
