import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms/server';
import {
	createEmailVerificationRequest,
	deleteEmailVerificationRequestCookie,
	deleteUserEmailVerificationRequest,
	getUserEmailVerificationRequestFromRequest,
	sendEmailVerificationCode,
	setEmailVerificationRequestCookie
} from '$lib/server/email-verification';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { setUserEmailAsVerified as setUserEmailAsVerified } from '$lib/server/user';
import { emailCodeSchema } from '$lib/schema';
import { invalidateUserPasswordResetSessions } from '$lib/server/password-reset';

export const load: PageServerLoad = async (event) => {
	const { user } = event.locals;

	if (user === null) redirect(302, '/signin');

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest == null || Date.now() >= verificationRequest.expiresAt.getTime()) {
		if (user.emailVerified) redirect(302, '/');

		verificationRequest = await createEmailVerificationRequest(user.id, user.email);
		sendEmailVerificationCode(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);
	}

	const form = await superValidate(zod(emailCodeSchema));
	return { form };
};

export const actions: Actions = {
	verify: verifyCode,
	resend: resendEmail
};

async function verifyCode(event: RequestEvent) {
	const { session, user } = event.locals;
	if (session === null || user === null) return fail(401, { message: 'Not authenticated' });
	if (user.registered2FA && !session.twoFactorVerified) return fail(403, { message: 'Forbidden' });

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null) return fail(401, { message: 'Not authenticated' });

	const form = await superValidate(event.request, zod(emailCodeSchema));
	if (!form.valid) return fail(400, { form });

	const { code } = form.data;

	if (Date.now() >= verificationRequest.expiresAt.getTime()) {
		verificationRequest = await createEmailVerificationRequest(
			verificationRequest.userId,
			verificationRequest.email
		);
		sendEmailVerificationCode(verificationRequest.email, verificationRequest.code);
		return fail(400, {
			message: 'The verification code was expired. We sent another code to your inbox.'
		});
	}

	if (verificationRequest.code !== code) return setError(form, 'Incorrect code.');

	await deleteUserEmailVerificationRequest(user.id);
	await invalidateUserPasswordResetSessions(user.id);
	await setUserEmailAsVerified(user.id, verificationRequest.email);
	deleteEmailVerificationRequestCookie(event);

	return redirect(302, '/');
}

async function resendEmail(event: RequestEvent) {
	const { session, user } = event.locals;
	if (session === null || user === null) return fail(401, { message: 'Not authenticated' });

	if (user.registered2FA && !session.twoFactorVerified) return fail(403, { message: 'Forbidden' });

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null) {
		if (user.emailVerified) return fail(403, { message: 'Forbidden' });

		verificationRequest = await createEmailVerificationRequest(user.id, user.email);
	}

	await sendEmailVerificationCode(verificationRequest.email, verificationRequest.code);
	setEmailVerificationRequestCookie(event, {
		id: verificationRequest.id,
		expiresAt: verificationRequest.expiresAt
	});

	return { message: 'A verification code was sent to your email address' };
}
