// Deliberately duplicates the vars wrangler writes into
// worker-configuration.d.ts. Wrangler only knows about them because it reads
// .dev.vars, which is git-ignored - so on a fresh clone `npm run cf-typegen`
// would silently drop them all. Declaring them here keeps the build honest.
// Identical `string` types merge cleanly with the generated interface.
declare namespace Cloudflare {
	interface Env {
		BETTER_AUTH_SECRET: string;
		BETTER_AUTH_URL: string;
		DISCORD_CLIENT_ID: string;
		DISCORD_CLIENT_SECRET: string;
		/**
		 * GitHub OAuth App used for *signing in*. Separate from the GitHub App
		 * below, which is the commit bot: a GitHub App's user-to-server tokens
		 * grant email access through account permissions rather than scopes, so
		 * reusing it for login would not reliably yield the address better-auth
		 * needs for the user row.
		 */
		GITHUB_CLIENT_ID: string;
		GITHUB_CLIENT_SECRET: string;
		/** GitHub App issuer. The Client ID works and is what GitHub recommends. */
		GITHUB_APP_ID: string;
		GITHUB_APP_INSTALLATION_ID: string;
		/** base64 of the PKCS#8 private key - WebCrypto cannot import PKCS#1. */
		GITHUB_APP_PRIVATE_KEY: string;
		/** owner/repo the wiki content lives in. */
		GITHUB_REPO: string;
	}
}

declare namespace App {
	interface Locals {
		user: import('better-auth').User | null;
	}
}
