import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms/server';
import { signUpSchema } from '$lib/schema';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { dev } from '$app/environment';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/session';
import { createUser } from '$lib/server/user';
import {
	createEmailVerificationRequest,
	sendEmailVerificationCode,
	setEmailVerificationRequestCookie
} from '$lib/server/email-verification';
import { verifyPasswordStrength } from '$lib/server/password';

export const load: PageServerLoad = async (event) => {
	if (!dev) redirect(302, '/');

	if (event.locals.session !== null && event.locals.user !== null) {
		if (!event.locals.user.emailVerified) redirect(302, '/verify-email');
		if (!event.locals.user.registered2FA) redirect(302, '/2fa/setup');
		if (!event.locals.session.twoFactorVerified) redirect(302, '/2fa');

		redirect(302, '/');
	}

	const form = await superValidate(zod(signUpSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod(signUpSchema));
		if (!form.valid) return fail(400, { form });

		const { name, email, password } = form.data;

		const isPasswordStrong = await verifyPasswordStrength(password);
		if (!isPasswordStrong) return setError(form, 'password', 'Weak password');

		const user = await createUser(name, email, password);
		const emailVerificationRequest = await createEmailVerificationRequest(user.id, user.email);
		await sendEmailVerificationCode(emailVerificationRequest.email, emailVerificationRequest.code);
		setEmailVerificationRequestCookie(event, {
			id: emailVerificationRequest.id,
			expiresAt: emailVerificationRequest.expiresAt
		});

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, {
			userId: user.id,
			role: user.role
		});

		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		redirect(302, '/email-verification');
	}
};
