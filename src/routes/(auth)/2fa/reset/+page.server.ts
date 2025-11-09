import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { recoveryCodeSchema } from '$lib/schema';
import { resetUser2FAWithRecoveryCode } from '$lib/server/2fa';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { session, user } = event.locals;

	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (!user.registered2FA || session.twoFactorVerified) redirect(302, '/');

	const form = await superValidate(zod(recoveryCodeSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = event.locals;
		if (session === null || user === null) return fail(401, { message: 'Not authenticated' });

		if (!user.emailVerified || !user.registered2FA || session.twoFactorVerified)
			return fail(403, { message: 'Forbidden' });

		const form = await superValidate(event.request, zod(recoveryCodeSchema));
		if (!form.valid) return fail(400, { form });

		const { code } = form.data;
		const isValid = await resetUser2FAWithRecoveryCode(user.id, code);
		if (!isValid) return fail(400, { message: 'Invalid recovery code' });

		return redirect(302, '/');
	}
};
