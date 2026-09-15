import { betterAuth } from 'better-auth';
import { passkey } from '@better-auth/passkey';
import { env } from 'cloudflare:workers';
import { normaliseDisplayName } from './attribution';

/**
 * Providers with credentials present, so a missing secret hides its button
 * instead of shipping one that 500s with "OAuth provider requires clientId".
 */
export function configuredProviders(): Array<'discord' | 'github'> {
	const configured: Array<'discord' | 'github'> = [];
	if (env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) configured.push('discord');
	if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) configured.push('github');
	return configured;
}

// One instance per request: the D1 binding is only live inside a request.
// better-auth takes the D1Database directly, no Kysely dialect needed.
//
// Adding a plugin here? Re-run `npm run gen:auth-schema` - the schema is
// generated from this plugin list, not hand-written.
export function createAuth() {
	const url = new URL(env.BETTER_AUTH_URL);

	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		database: env.DB,

		databaseHooks: {
			user: {
				create: {
					// Single choke point for every sign-up path, Discord included.
					// The display name becomes the git commit author, so it is public
					// and permanent - normalise it before it can ever reach a commit.
					before: async (user) => ({
						data: { ...user, name: normaliseDisplayName(user.name) },
					}),
				},
				update: {
					// Same rule on the way in from the profile page - otherwise a
					// name rejected at sign-up could just be set afterwards.
					before: async (user) => ({
						data: user.name === undefined ? user : { ...user, name: normaliseDisplayName(user.name) },
					}),
				},
			},
		},

		// The only ways to create an account. Both providers verify an email
		// address themselves, so there is nothing for us to verify - and no
		// unauthenticated endpoint of ours that creates anything, which is why
		// there is no captcha here.
		socialProviders: {
			...(configuredProviders().includes('discord') && {
				discord: {
					clientId: env.DISCORD_CLIENT_ID,
					clientSecret: env.DISCORD_CLIENT_SECRET,
				},
			}),
			...(configuredProviders().includes('github') && {
				github: {
					clientId: env.GITHUB_CLIENT_ID,
					clientSecret: env.GITHUB_CLIENT_SECRET,
				},
			}),
		},

		plugins: [
			// A passkey is a convenience credential added once signed in, never a
			// way to sign up: registration requires a session, so every account
			// still starts at a social provider.
			passkey({
				rpID: url.hostname,
				rpName: 'MeshCore NZ Wiki',
				origin: url.origin,
			}),
		],
	});
}
