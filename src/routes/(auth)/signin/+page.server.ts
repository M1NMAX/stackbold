import { auth } from '$lib/server/lucia';
import { LuciaError } from 'lucia';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { message, superValidate } from 'sveltekit-superforms/server';

import type { PageServerLoad, Actions } from './$types';

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6).max(255)
});

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

	if (session) {
		if (!session.user.emailVerified) redirect(302, '/email-verification');
		redirect(302, '/');
	}
	const form = await superValidate(loginSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, loginSchema);

		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;

		try {
			// find user by key and validate password
			const key = await auth.useKey('email', email.toLowerCase(), password);
			const session = await auth.createSession({
				userId: key.userId,
				attributes: {}
			});
			locals.auth.setSession(session); // set session cookie
		} catch (e) {
			if (
				e instanceof LuciaError &&
				(e.message === 'AUTH_INVALID_KEY_ID' || e.message === 'AUTH_INVALID_PASSWORD')
			) {
				// user does not exist or invalid password
				return message(form, 'Incorrect email or password');
			}

			return message(form, 'An unknown error occurred');
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		redirect(302, '/');
	}
};
