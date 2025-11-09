import { validatePasswordResetSessionRequest } from '$lib/server/password-reset';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { recoveryCodeSchema } from '$lib/schema';
import type { Actions, PageServerLoad } from './$types';
import { resetUser2FAWithRecoveryCode } from '$lib/server/2fa';

export const load: PageServerLoad = async (event) => {
	const { session, user } = await validatePasswordResetSessionRequest(event);

	if (session === null) redirect(302, '/forgot-password');
	if (!session.emailVerified) redirect(302, '/reset-password/verify-email');
	if (!user.registered2FA || session.twoFactorVerified) redirect(302, '/reset-password');

	const form = await superValidate(zod(recoveryCodeSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = await validatePasswordResetSessionRequest(event);
		if (session === null) return fail(401, { message: 'Not authenticated' });

		if (!session.emailVerified || !user.registered2FA || session.twoFactorVerified)
			return fail(403, { message: 'Forbidden' });

		const form = await superValidate(event.request, zod(recoveryCodeSchema));
		if (!form.valid) return fail(400, { form });

		const { code } = form.data;

		const isValid = resetUser2FAWithRecoveryCode(session.userId, code);
		if (!isValid) return fail(400, { message: 'Invalid code' });

		return redirect(302, '/reset-password');
	}
};
