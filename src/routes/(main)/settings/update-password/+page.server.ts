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
	const { session, user } = event.locals;
	if (session === null || user === null) redirect(302, '/signin');
	if (!user.emailVerified) redirect(302, '/verify-email');
	if (user.registered2FA && !session.twoFactorVerified) redirect(302, '/2fa');

	const form = await superValidate(zod(updPasswordSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = event.locals;
		if (session === null || user === null) return fail(401, { message: 'Not authenticated' });

		if (user.registered2FA && !session.twoFactorVerified)
			return fail(403, { message: 'Forbidden' });

		const form = await superValidate(event.request, zod(updPasswordSchema));
		if (!form.valid) return fail(400, { form });

		const { currentPassword, newPassword } = form.data;

		const isPasswordStrong = await verifyPasswordStrength(newPassword);
		if (!isPasswordStrong) return fail(400, { message: 'Weak password' });

		const passwordHash = await getUserPasswordHash(user.id);
		const validPassword = await verifyPasswordHash(passwordHash, currentPassword);

		if (!validPassword) return fail(400, { message: 'Incorrect password' });

		invalidateUserSessions(user.id);
		await updateUserPassword(user.id, newPassword);

		const sessionToken = generateSessionToken();
		const createdSession = await createSession(sessionToken, {
			userId: user.id,
			role: user.role,
			twoFactorVerified: session.twoFactorVerified
		});

		setSessionTokenCookie(event, sessionToken, createdSession.expiresAt);
		redirect(302, '/settings');
	}
};
