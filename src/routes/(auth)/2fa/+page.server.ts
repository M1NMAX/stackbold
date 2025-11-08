import { fail, redirect } from '@sveltejs/kit';
import { getUserTOTPKey } from '$lib/server/user';
import { verifyTOTP } from '@oslojs/otp';
import { setSessionAs2FAVerified } from '$lib/server/session';
import { totpCodeSchema } from '$lib/schema';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { session, user } = event.locals;

	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (!user.registered2FA || session.twoFactorVerified) redirect(302, '/');

	const form = await superValidate(zod(totpCodeSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = event.locals;
		if (session === null || user === null) return fail(401, { message: 'Not authenticated' });

		if (!user.emailVerified || !user.registered2FA || session.twoFactorVerified)
			return fail(403, { message: 'Forbidden' });

		const form = await superValidate(event.request, zod(totpCodeSchema));
		if (!form.valid) return fail(400, { form });
		const { code } = form.data;

		const totpKey = await getUserTOTPKey(user.id);
		if (totpKey === null) return fail(403, { message: 'Forbidden' });

		if (!verifyTOTP(totpKey, 30, 6, code)) return fail(400, { message: 'Invalid code' });

		await setSessionAs2FAVerified(session.id);
		return redirect(302, '/');
	}
};
