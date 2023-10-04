import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { message, superValidate } from 'sveltekit-superforms/server';

import type { PageServerLoad, Actions } from './$types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const signUpSchema = z.object({
	username: z.string().min(1).max(31),
	password: z.string().min(6).max(255)
});

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) throw redirect(302, '/');

	const form = await superValidate(signUpSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, signUpSchema);

		if (!form.valid) return fail(400, { form });

		const { username, password } = form.data;

		try {
			const user = await auth.createUser({
				key: {
					providerId: 'username', // auth method
					providerUserId: username.toLowerCase(), // unique id when using "username" auth method
					password // hashed by Lucia
				},
				attributes: {
					username
				}
			});
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session); // set session cookie
		} catch (e) {
			// check for unique constraint error in user table
			if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
				return message(form, 'Username already taken');
			}
			return message(form, 'An unknown error occurred');
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, '/');
	}
};
