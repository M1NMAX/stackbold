import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { signUpSchema } from '$lib/schema';
import { generateEmailVerificationCode, sendEmailVerificationCode } from '$lib/server/email';
import { zod } from 'sveltekit-superforms/adapters';
import { dev } from '$app/environment';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import { createUser } from '$lib/server/user';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (user) {
		redirect(302, '/');
	}

	if (!dev) {
		redirect(302, '/signin');
	}

	const form = await superValidate(zod(signUpSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod(signUpSchema));

		if (!form.valid) return fail(400, { form });

		const { name, email, password } = form.data;

		//TODO: check password strength
		//TODO: check if username is already used
		const user = await createUser(name, email, password);

		const verficationCode = await generateEmailVerificationCode(user.id, email);
		await sendEmailVerificationCode(email, verficationCode);

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, {
			userId: user.id,
			role: user.role
		});

		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		redirect(302, '/email-verification');
	}
};
