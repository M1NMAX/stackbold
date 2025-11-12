import { getUserRecoverCode } from '$lib/server/user';
import { superValidate } from 'sveltekit-superforms/server';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { updEmailSchema } from '$lib/schema';
import { createCaller } from '$lib/trpc/router';
import { createContext } from '$lib/trpc/context';

export const load: PageServerLoad = async (event) => {
	const { session, user } = event.locals;

	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (user.registered2FA && !session.twoFactorVerified) redirect(302, '/2fa');

	let recoveryCode: string | null = null;
	if (user.registered2FA) recoveryCode = await getUserRecoverCode(user.id);

	const emailUpdForm = await superValidate(zod(updEmailSchema));

	return { emailUpdForm, recoveryCode, user };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = event.locals;
		if (session === null || user === null) return fail(401, { message: 'Not authenticated' });

		if (!user.emailVerified || (!user.registered2FA && session.twoFactorVerified))
			return fail(403, { message: 'Forbidden' });

		await createCaller(await createContext(event)).users.delete(user.id);
	}
};
