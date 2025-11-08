import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { updEmailSchema } from '$lib/schema';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import {
	createEmailVerificationRequest,
	sendEmailVerificationCode,
	setEmailVerificationRequestCookie
} from '$lib/server/email-verification';

export const load: PageServerLoad = async (event) => {
	const { session, user } = event.locals;
	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (user.registered2FA && !session.twoFactorVerified) redirect(302, '/2fa');

	const form = await superValidate(zod(updEmailSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = event.locals;
		if (session === null || user === null) return fail(401, { message: 'Not authenticated' });

		if (user.registered2FA && !session.twoFactorVerified)
			return fail(403, { message: 'Forbidden' });

		const form = await superValidate(event.request, zod(updEmailSchema));
		if (!form.valid) return fail(400, { form });

		const { email } = form.data;

		const verificationRequest = await createEmailVerificationRequest(user.id, email);
		sendEmailVerificationCode(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);
		return redirect(302, '/verify-email');
	}
};
