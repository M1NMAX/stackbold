import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { message, superValidate } from 'sveltekit-superforms/server';
import { LuciaError } from 'lucia';

const updUserSchema = z.object({
	name: z.string().min(4).max(31),
	email: z.string().email().nullable()
});

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth.validate();

	if (!session) redirect(302, '/signin');

	const user = session.user;

	const form = await superValidate(updUserSchema);

	return { user, form };
};
export const actions: Actions = {
	logout: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
		redirect(302, '/signin'); // redirect to login page
	},
	updUserData: async ({ request, locals }) => {
		const session = await locals.auth.validate();
		if (!session) redirect(302, '/signin');

		const form = await superValidate(request, updUserSchema);

		if (!form.valid) return fail(400, { form });

		const { name } = form.data;

		try {
			await auth.updateUserAttributes(session.user.userId, {
				name: name
			});
		} catch (e) {
			if (e instanceof LuciaError && e.message === `AUTH_INVALID_USER_ID`) {
				return message(form, 'Invalid name');
			}
			return message(form, 'An unknown error occurred');
		}
	}
};
