import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { message, superValidate } from 'sveltekit-superforms/server';

import type { PageServerLoad, Actions } from './$types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { generateEmailVerificationToken } from '$lib/server/token';
import { sendEmailVerificationLink } from '$lib/server/email';

const signUpSchema = z.object({
	name: z.string().min(4).max(31),
	email: z.string().email(),
	password: z.string().min(6).max(255)
});

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();

	if (session) {
		if (!session.user.emailVerified) redirect(302, '/email-verification');
		redirect(302, '/');
	}

	const form = await superValidate(signUpSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, signUpSchema);

		if (!form.valid) return fail(400, { form });

		const { name, email, password } = form.data;

		try {
			const user = await auth.createUser({
				key: {
					providerId: 'email', // auth method
					providerUserId: email.toLowerCase(), // unique id when using "username" auth method
					password // hashed by Lucia
				},
				attributes: {
					name,
					email: email.toLocaleLowerCase(),
					email_verified: false,
					role: 'MEMBER'
				}
			});
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session); // set session cookie

			const token = await generateEmailVerificationToken(user.userId);
			await sendEmailVerificationLink(token);
		} catch (e) {
			// check for unique constraint error in user table
			if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
				return message(form, 'Username already taken');
			}
			return message(form, 'An unknown error occurred');
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		redirect(302, '/');
	}
};
