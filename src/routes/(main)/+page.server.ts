import { fail, redirect } from '@sveltejs/kit';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/session';
import type { Actions } from './$types';

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) return fail(401, { message: 'Not authenticated' });

		await invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);
		redirect(302, '/signin');
	}
};
