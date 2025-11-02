import { fail, redirect } from '@sveltejs/kit';
import { getUserTOTPKey } from '$lib/server/user';
import { verifyTOTP } from '@oslojs/otp';
import { setSessionAs2FAVerified } from '$lib/server/session';
import { totpCodeSchema } from '$lib/schema';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session === null || event.locals.user === null) redirect(302, '/signin');
	if (!event.locals.user.emailVerified) redirect(302, '/verify-email');
	if (!event.locals.user.registered2FA || event.locals.session.twoFactorVerified)
		redirect(302, '/');

	const form = await superValidate(zod(totpCodeSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.session === null || event.locals.user === null)
			return fail(401, { message: 'Not authenticated' });

		if (
			!event.locals.user.emailVerified ||
			!event.locals.user.registered2FA ||
			event.locals.session.twoFactorVerified
		) {
			return fail(403, { message: 'Forbidden' });
		}

		const form = await superValidate(event.request, zod(totpCodeSchema));
		if (!form.valid) return fail(400, { form });
		const { code } = form.data;

		const totpKey = await getUserTOTPKey(event.locals.user.id);
		if (totpKey === null) return fail(403, { message: 'Forbidden' });

		if (!verifyTOTP(totpKey, 30, 6, code)) return fail(400, { message: 'Invalid code' });

		setSessionAs2FAVerified(event.locals.session.id);
		return redirect(302, '/');
	}
};
