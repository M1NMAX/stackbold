import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { signInSchema } from '$lib/schema';
import { zod } from 'sveltekit-superforms/adapters';
import { verifyPasswordHash } from '$lib/server/password';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import { getUserByEmail } from '$lib/server/user';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (user) redirect(302, '/');

	const form = await superValidate(zod(signInSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod(signInSchema));

		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;

		//TODO: Think about brute-force attack

		const user = await getUserByEmail(email);

		if (!user) return message(form, 'Invalid Credentials');

		const validPassword = await verifyPasswordHash(user.password, password);

		if (!validPassword) return message(form, 'Invalid Credentials');

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, {
			userId: user.id,
			role: user.role
		});

		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		if (!user.emailVerified) return redirect(302, '/email-verification');

		return redirect(302, '/');
	}
};
