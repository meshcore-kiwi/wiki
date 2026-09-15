import { createAuthClient } from 'better-auth/client';
import { passkeyClient } from '@better-auth/passkey/client';

export const auth = createAuthClient({ plugins: [passkeyClient()] });

export type SocialProvider = 'discord' | 'github';

/** better-auth returns errors rather than throwing; make one try/catch enough. */
export function check(error: { message?: string } | null | undefined, fallback: string) {
	if (error) throw new Error(error.message || fallback);
}

export const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

/**
 * Runs a click/submit handler with its button disabled and any failure shown
 * in the page's error element, instead of a browser dialog. Shared by every
 * auth surface: three pages had a byte-identical copy of this, and they had
 * already started to drift.
 */
export function attempt(
	button: HTMLButtonElement,
	action: () => Promise<void>,
	errorBox: HTMLElement | null = document.getElementById('error'),
) {
	if (errorBox) errorBox.hidden = true;
	button.disabled = true;

	return action()
		.catch((e: unknown) => {
			if (!errorBox) throw e;
			errorBox.textContent = e instanceof Error ? e.message : String(e);
			errorBox.hidden = false;
		})
		.finally(() => {
			button.disabled = false;
		});
}

const PROVIDER_NAMES: Record<SocialProvider, string> = {
	discord: 'Discord',
	github: 'GitHub',
};

export async function signInWithSocial(provider: SocialProvider, callbackURL = '/') {
	// Must start in the browser: better-auth sets a signed `state` cookie here
	// and requires it back on the callback.
	const { data, error } = await auth.signIn.social({ provider, callbackURL });
	check(error, `${PROVIDER_NAMES[provider]} sign-in is unavailable.`);
	if (data?.url) location.href = data.url;
}

export async function signInWithPasskey() {
	const res = await auth.signIn.passkey();
	check(res?.error, 'No passkey matched for this site.');
}


