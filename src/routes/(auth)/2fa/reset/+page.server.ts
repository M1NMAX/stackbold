import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { recoveryCodeSchema } from '$lib/schema';
import { resetUser2FAWithRecoveryCode } from '$lib/server/2fa';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session === null || event.locals.user === null) redirect(302, '/signin');
	if (!event.locals.user.emailVerified) redirect(302, '/verify-email');
	if (!event.locals.user.registered2FA || event.locals.session.twoFactorVerified)
		redirect(302, '/');

	const form = await superValidate(zod(recoveryCodeSchema));
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

		const form = await superValidate(event.request, zod(recoveryCodeSchema));
		if (!form.valid) return fail(400, { form });

		const { code } = form.data;
		const valid = await resetUser2FAWithRecoveryCode(event.locals.user.id, code);
		if (!valid) return fail(400, { message: 'Invalid recovery code' });

		return redirect(302, '/');
	}
};
