import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import { isValidPasswordResetToken, validatePasswordResetToken } from '$lib/server/token';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

import type { PageServerLoad, Actions } from './$types';

const passwordSchema = z.object({
	password: z.string().min(6).max(255)
});

export const load: PageServerLoad = async ({ params }) => {
	const { token } = params;
	const validToken = await isValidPasswordResetToken(token);
	if (!validToken) {
		redirect(302, '/password-reset');
	}

	const form = await superValidate(passwordSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const form = await superValidate(request, passwordSchema);

		if (!form.valid) return fail(400, { form });

		const { password } = form.data;

		try {
			const { token } = params;
			const userId = await validatePasswordResetToken(token);
			let user = await auth.getUser(userId);
			await auth.invalidateAllUserSessions(user.userId);
			await auth.updateKeyPassword('email', user.email, password);
			if (!user.emailVerified) {
				user = await auth.updateUserAttributes(user.userId, {
					email_verified: true
				});
			}
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session);
		} catch (e) {
			return message(form, 'Invalid or expired password reset link');
		}
		redirect(302, '/');
	}
};
