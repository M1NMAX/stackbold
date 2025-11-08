import { getUserRecoverCode } from '$lib/server/user';
import { superValidate } from 'sveltekit-superforms/server';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { updEmailSchema } from '$lib/schema';

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
