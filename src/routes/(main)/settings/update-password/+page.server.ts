import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { updPasswordSchema } from '$lib/schema';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { verifyPasswordHash, verifyPasswordStrength } from '$lib/server/password';
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from '$lib/server/session';
import { getUserPasswordHash, updateUserPassword } from '$lib/server/user';

export const load: PageServerLoad = async (event) => {
	if (event.locals.session === null || event.locals.user === null) redirect(302, '/signin');
	if (!event.locals.user.emailVerified) redirect(302, '/verify-email');
	if (!event.locals.user.registered2FA) redirect(302, '/settings/2fa-setup');
	if (!event.locals.session.twoFactorVerified) redirect(302, '/2fa');

	const form = await superValidate(zod(updPasswordSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		if (event.locals.session === null || event.locals.user === null)
			return fail(401, { message: 'Not authenticated' });

		if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified)
			return fail(403, { message: 'Forbidden' });

		const form = await superValidate(event.request, zod(updPasswordSchema));
		if (!form.valid) return fail(400, { form });

		const { currentPassword, newPassword } = form.data;

		const isPasswordStrong = await verifyPasswordStrength(newPassword);
		if (!isPasswordStrong) return fail(400, { message: 'Weak password' });

		const passwordHash = await getUserPasswordHash(event.locals.user.id);
		const validPassword = await verifyPasswordHash(passwordHash, currentPassword);

		if (!validPassword) return fail(400, { message: 'Incorrect password' });

		invalidateUserSessions(event.locals.user.id);
		await updateUserPassword(event.locals.user.id, newPassword);

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, {
			userId: event.locals.user.id,
			role: event.locals.user.role,
			twoFactorVerified: event.locals.session.twoFactorVerified
		});

		setSessionTokenCookie(event, sessionToken, session.expiresAt);
		redirect(302, '/settings');
	}
};
