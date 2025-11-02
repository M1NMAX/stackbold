import { setError, superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { emailCodeSchema } from '$lib/schema';
import {
	setPasswordResetSessionAsEmailVerified,
	validatePasswordResetSessionRequest
} from '$lib/server/password-reset';
import { setUserAsEmailVerifiedIfEmailMatches } from '$lib/server/user';

export const load: PageServerLoad = async (event) => {
	const { session, user } = await validatePasswordResetSessionRequest(event);
	if (session === null) redirect(302, '/forgot-password');

	if (session.emailVerified) {
		if (user.registered2FA && !session.twoFactorVerified) redirect(302, '/reset-password/2fa');
		redirect(302, '/reset-password');
	}
	const form = await superValidate(zod(emailCodeSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = await validatePasswordResetSessionRequest(event);
		if (session === null) return fail(401, { message: 'Not authenticated' });
		if (session.emailVerified) return fail(403, { message: 'Forbidden' });

		const form = await superValidate(event.request, zod(emailCodeSchema));
		if (!form.valid) return fail(400, { form });

		const { code } = form.data;
		if (code !== session.code) return setError(form, 'Incorrect code');

		setPasswordResetSessionAsEmailVerified(session.id);
		const emailMatches = await setUserAsEmailVerifiedIfEmailMatches(session.userId, session.email);
		if (!emailMatches) return setError(form, 'Please restart the process');

		if (user.registered2FA) redirect(302, '/reset-password/2fa');
		return redirect(302, '/reset-password');
	}
};
