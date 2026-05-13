import { fail, redirect } from '@sveltejs/kit';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';
import { createCaller } from '$lib/trpc/router';
import { createContext } from '$lib/trpc/context';

export const load: PageServerLoad = async (event) => {
	const caller = createCaller(await createContext(event));

	return { items: await caller.items.dashboard() };
};

export const actions: Actions = {
	logout: async (event) => {
		if (event.locals.session === null || event.locals.user === null)
			return fail(401, { message: 'Not authenticated' });

		await invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);
		redirect(302, '/signin');
	}
};
