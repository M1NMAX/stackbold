import { twoFactorSetupSchema } from '$lib/schema';
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import { createTOTPKeyURI, verifyTOTP } from '@oslojs/otp';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { setSessionAs2FAVerified } from '$lib/server/session';
import { updateUserTOTPKey } from '$lib/server/user';
import { dev } from '$app/environment';

export const load: PageServerLoad = async (event) => {
	const { session, user } = event.locals;

	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (user.registered2FA && !session.twoFactorVerified) redirect(302, '/2fa');

	const totpKey = new Uint8Array(20);
	crypto.getRandomValues(totpKey);
	const encodedTOTPKey = encodeBase64(totpKey);
	const keyURI = createTOTPKeyURI(`Stackbold ${dev && '(Dev)'}`, user.name, totpKey, 30, 6);
	const form = await superValidate(zod(twoFactorSetupSchema));
	return { form, encodedTOTPKey, keyURI };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = event.locals;
		if (session === null || user === null) return fail(401, { message: 'Not authenticated' });
		if (!user.emailVerified) return fail(403, { message: 'Forbidden' });

		if (user.registered2FA && !session.twoFactorVerified)
			return fail(403, { message: 'Forbidden' });

		const form = await superValidate(event.request, zod(twoFactorSetupSchema));
		const { key: encodedKey, code } = form.data;

		let key: Uint8Array;
		try {
			key = decodeBase64(encodedKey);
		} catch {
			return fail(400, { message: 'Invalid key' });
		}
		if (key.byteLength !== 20) return fail(400, { message: 'Invalid key' });

		if (!verifyTOTP(key, 30, 6, code)) return fail(400, { message: 'Invalid code' });

		updateUserTOTPKey(session.userId, key);
		setSessionAs2FAVerified(session.id);
		redirect(302, '/settings/recovery-code');
	}
};
