import type { PageServerLoad, Actions } from './$types';
import { sendPasswordResetToken } from '$lib/server/email-verification';
import {
	createPasswordResetToken,
	invalidateUserPasswordResetSessions,
	setPasswordResetSessionTokenCookie
} from '$lib/server/password-reset';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { getUserByEmail } from '$lib/server/user';
import { generateSessionToken } from '$lib/server/session';

const emailSchema = z.object({
	email: z.email()
});

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(emailSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod(emailSchema));
		if (!form.valid) return fail(400, { form });

		const { email } = form.data;
		const user = await getUserByEmail(email);
		if (user) {
			await invalidateUserPasswordResetSessions(user.id);
			const sessionToken = generateSessionToken();
			const session = await createPasswordResetToken(sessionToken, user.id, user.email);
			await sendPasswordResetToken(session.email, session.code);
			setPasswordResetSessionTokenCookie(event, sessionToken, session.expiresAt);
		}
		return redirect(302, '/reset-password/verify-email');
	}
};
