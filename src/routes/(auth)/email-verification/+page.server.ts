import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import {
	generateEmailVerificationCode,
	sendEmailVerificationCode,
	verifyVerificationCode
} from '$lib/server/email';
import { zod } from 'sveltekit-superforms/adapters';
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from '$lib/server/session';

const codeSchema = z.object({
	code: z.string().length(8)
});

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) return redirect(302, '/signin');

	if (user.emailVerified) return redirect(302, '/');

	const form = await superValidate(zod(codeSchema));
	return { form };
};

export const actions: Actions = {
	validate: async (event) => {
		const user = event.locals.user;
		if (!user) redirect(302, '/');

		const form = await superValidate(event.request, zod(codeSchema));
		if (!form.valid) return fail(400, { form });

		const { code } = form.data;

		const isValid = await verifyVerificationCode(user, code);
		if (!isValid) return message(form, 'Invalid code');

		await invalidateUserSessions(user.id);

		await prisma.user.update({
			where: { id: user.id },
			data: { emailVerified: true }
		});

		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, {
			userId: user.id,
			role: user.role
		});

		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		redirect(302, '/');
	},
	resend: async ({ locals }) => {
		const user = locals.user;
		if (!user) return fail(400);
		const form = await superValidate(zod(codeSchema));

		try {
			const verficationCode = await generateEmailVerificationCode(user.id, user.email);
			await sendEmailVerificationCode(user.email, verficationCode);

			return message(form, 'A verification code was sent to your email address');
		} catch (error) {
			console.error(error);
			return fail(500, {
				message: 'Something went wrong, please try later!'
			});
		}
	}
};
