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
import { recoveryCodeSchema } from '$lib/schema';
import { invalidateUserPasswordResetSessions } from '$lib/server/password-reset';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user === null) redirect(302, '/signin');

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest == null || Date.now() >= verificationRequest.expiresAt.getTime()) {
		if (event.locals.user.emailVerified) redirect(302, '/');

		verificationRequest = await createEmailVerificationRequest(
			event.locals.user.id,
			event.locals.user.email
		);
		sendEmailVerificationCode(verificationRequest.email, verificationRequest.code);
		setEmailVerificationRequestCookie(event, verificationRequest);
	}

	const form = await superValidate(zod(recoveryCodeSchema));
	return { form };
};

export const actions: Actions = {
	verify: verifyCode,
	resend: resendEmail
};

async function verifyCode(event: RequestEvent) {
	if (event.locals.session === null || event.locals.user === null)
		return fail(401, { message: 'Not authenticated' });

	if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified)
		return fail(403, { message: 'Forbidden' });

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null) return fail(401, { message: 'Not authenticated' });

	const form = await superValidate(event.request, zod(recoveryCodeSchema));
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

	await deleteUserEmailVerificationRequest(event.locals.user.id);
	invalidateUserPasswordResetSessions(event.locals.user.id);
	setUserEmailAsVerified(event.locals.user.id, verificationRequest.email);
	deleteEmailVerificationRequestCookie(event);

	if (!event.locals.user.registered2FA) redirect(302, '/2fa/setup');
	return redirect(302, '/');
}

async function resendEmail(event: RequestEvent) {
	if (event.locals.session === null || event.locals.user === null) {
		return fail(401, { message: 'Not authenticated' });
	}

	if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
		return fail(403, { message: 'Forbidden' });
	}

	let verificationRequest = await getUserEmailVerificationRequestFromRequest(event);
	if (verificationRequest === null) {
		if (event.locals.user.emailVerified) return fail(403, { message: 'Forbidden' });

		verificationRequest = await createEmailVerificationRequest(
			event.locals.user.id,
			event.locals.user.email
		);
	}

	await sendEmailVerificationCode(verificationRequest.email, verificationRequest.code);
	setEmailVerificationRequestCookie(event, {
		id: verificationRequest.id,
		expiresAt: verificationRequest.expiresAt
	});

	return { message: 'A verification code was sent to your email address' };
}
