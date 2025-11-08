import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { updNameSchema } from '$lib/schema';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { updateUserName } from '$lib/server/user';

export const load: PageServerLoad = async (event) => {
	const { session, user } = event.locals;

	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (user.registered2FA && !session.twoFactorVerified) redirect(302, '/2fa');

	const form = await superValidate(zod(updNameSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = event.locals;
		if (session === null || user === null) return fail(401, { message: 'Not authenticated' });

		if (user.registered2FA && !session.twoFactorVerified)
			return fail(403, { message: 'Forbidden' });

		const form = await superValidate(event.request, zod(updNameSchema));
		if (!form.valid) return fail(400, { form });

		const { name } = form.data;
		await updateUserName(user.id, name);

		return redirect(302, '/settings');
	}
};
