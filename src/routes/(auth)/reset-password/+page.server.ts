import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from '$lib/server/session';
import { updateUserPassword } from '$lib/server/user';
import { passwordSchema } from '$lib/schema';
import {
	deletePasswordResetSessionTokenCookie,
	invalidateUserPasswordResetSessions,
	validatePasswordResetSessionRequest
} from '$lib/server/password-reset';

export const load: PageServerLoad = async (event) => {
	const { session, user } = await validatePasswordResetSessionRequest(event);
	if (session === null) return redirect(302, '/forgot-password');

	if (!session.emailVerified) return redirect(302, '/reset-password/verify-email');

	if (user.registered2FA && !session.twoFactorVerified) return redirect(302, '/reset-password/2fa');

	const form = await superValidate(zod(passwordSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const { session, user } = await validatePasswordResetSessionRequest(event);

		if (session === null) return fail(401, { message: 'Not authenticated' });
		if (!session.emailVerified) return fail(403, { message: 'Forbidden' });

		if (user.registered2FA && !session.twoFactorVerified)
			return fail(403, { message: 'Forbidden' });

		const form = await superValidate(event.request, zod(passwordSchema));
		if (!form.valid) return fail(400, { form });

		const { password } = form.data;

		invalidateUserPasswordResetSessions(session.userId);
		invalidateUserSessions(session.userId);
		await updateUserPassword(session.userId, password);

		const sessionToken = generateSessionToken();
		const createdSession = await createSession(sessionToken, {
			userId: user.id,
			role: user.role,
			twoFactorVerified: session.twoFactorVerified
		});
		setSessionTokenCookie(event, sessionToken, createdSession.expiresAt);
		deletePasswordResetSessionTokenCookie(event);
		return redirect(302, '/');
	}
};
