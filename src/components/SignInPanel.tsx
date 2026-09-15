import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, check, type SocialProvider } from '@/lib/auth-ui';

const LABELS: Record<SocialProvider, string> = { discord: 'Discord', github: 'GitHub' };

type Props = {
	/** Providers with credentials configured, decided on the server. */
	providers: SocialProvider[];
	/** Already validated by safeRedirect before it reached the client. */
	next: string;
	/** Sign-in offers passkeys; sign-up cannot (registration needs a session). */
	withPasskey?: boolean;
};

export function SignInPanel({ providers, next, withPasskey = false }: Props) {
	// Which button is busy, so only that one shows a spinner.
	const [busy, setBusy] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function run(id: string, action: () => Promise<void>) {
		setError(null);
		setBusy(id);
		try {
			await action();
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(null);
		}
	}

	const social = (provider: SocialProvider) =>
		run(provider, async () => {
			// Must start in the browser: better-auth sets a signed `state` cookie
			// here and requires it back on the callback.
			const { data, error: err } = await auth.signIn.social({ provider, callbackURL: next });
			check(err, `${LABELS[provider]} sign-in is unavailable.`);
			if (data?.url) location.href = data.url;
		});

	const passkey = () =>
		run('passkey', async () => {
			check((await auth.signIn.passkey())?.error, 'No passkey matched for this site.');
			location.href = next;
		});

	return (
		<div className="flex flex-col gap-3">
			{providers.map((provider) => (
				<Button
					key={provider}
					size="lg"
					className="w-full justify-center"
					disabled={busy !== null}
					onClick={() => social(provider)}
				>
					{busy === provider && <Loader2 className="size-4 animate-spin" />}
					Continue with {LABELS[provider]}
				</Button>
			))}

			{withPasskey && (
				<>
					<div className="my-2 flex items-center gap-3 text-xs text-muted-foreground">
						<span className="h-px flex-1 bg-border" />
						already added a passkey?
						<span className="h-px flex-1 bg-border" />
					</div>

					<Button
						variant="outline"
						size="lg"
						className="w-full justify-center"
						disabled={busy !== null}
						onClick={passkey}
					>
						{busy === 'passkey' && <Loader2 className="size-4 animate-spin" />}
						Sign in with a passkey
					</Button>
				</>
			)}

			{error && (
				<p role="alert" className="text-sm font-medium text-destructive">
					{error}
				</p>
			)}
		</div>
	);
}
