import type { APIRoute } from 'astro';
import { listDrafts, recordOutcome } from '../../lib/drafts';
import { pullRequestFeedback, pullRequestState, pullRequestUrl } from '../../lib/github/client';

export const prerender = false;

/**
 * A contributor's history with live review state. Polled on page load rather
 * than driven by webhooks - for a wiki's edit rate that is plenty, and it
 * cannot drift out of sync the way stored state can.
 *
 * ponytail: no webhooks. Add them when someone wants an email the moment a
 * moderator replies.
 */
export const GET: APIRoute = async (ctx) => {
	const user = ctx.locals.user;
	if (!user) return Response.json({ error: 'Sign in' }, { status: 401 });

	const drafts = await listDrafts(user.id);

	const contributions = await Promise.all(
		drafts.map(async (draft) => {
			if (draft.prNumber === null) {
				return { ...draft, pr: null, feedback: [] };
			}

			// merged and closed are terminal, so there is nothing to re-read.
			// Without this, every load of /account fired three GitHub calls per
			// historical draft - unbounded, concurrent, and past GitHub's
			// 100-concurrent limit for an installation, which would throttle the
			// token the save path also needs.
			if (draft.status === 'merged' || draft.status === 'closed') {
				return {
					...draft,
					pr: {
						number: draft.prNumber,
						url: pullRequestUrl(draft.prNumber),
						state: 'closed' as const,
						merged: draft.status === 'merged',
						changedFiles: 0,
					},
					feedback: [],
				};
			}
			try {
				const [pr, feedback] = await Promise.all([
					pullRequestState(draft.prNumber),
					pullRequestFeedback(draft.prNumber),
				]);

				// GitHub is the source of truth for the outcome; our row is a cache.
				const outcome = pr.merged ? 'merged' : pr.state === 'closed' ? 'closed' : 'submitted';
				if (outcome !== draft.status) await recordOutcome(draft.id, outcome);

				return { ...draft, status: outcome, pr, feedback };
			} catch (e) {
				console.error('[contributions] pr lookup failed', draft.prNumber, e);
				return { ...draft, pr: null, feedback: [], unavailable: true };
			}
		}),
	);

	return Response.json({ contributions });
};
