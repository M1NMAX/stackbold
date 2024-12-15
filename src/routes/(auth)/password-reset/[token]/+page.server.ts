import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';
import { encodeHex } from 'oslo/encoding';
import { sha256 } from 'oslo/crypto';
import { prisma } from '$lib/server/prisma';
import { isWithinExpirationDate } from 'oslo';
import { zod } from 'sveltekit-superforms/adapters';
import {
	createSession,
	generateSessionToken,
	invalidateUserSessions,
	setSessionTokenCookie
} from '$lib/server/session';
import { updateUserPassword } from '$lib/server/user';

const passwordSchema = z.object({
	password: z.string().min(6).max(255)
});

export const load: PageServerLoad = async ({ params }) => {
	const form = await superValidate(zod(passwordSchema));
	return { form };
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod(passwordSchema));
		if (!form.valid) return fail(400, { form });

		const { password } = form.data;

		const verificationToken = event.params.token;
		const tokenHash = encodeHex(await sha256(new TextEncoder().encode(verificationToken)));

		const storedToken = await prisma.passwordResetToken.findFirst({ where: { token: tokenHash } });

		if (storedToken) await prisma.passwordResetToken.deleteMany({ where: { token: tokenHash } });

		if (!storedToken || !isWithinExpirationDate(storedToken.expiredAt)) return fail(400);

		await invalidateUserSessions(storedToken.userId);

		const user = await updateUserPassword(storedToken.userId, password);

		const sessionToken = generateSessionToken();

		const session = await createSession(sessionToken, {
			userId: user.id,
			role: user.role
		});

		setSessionTokenCookie(event, sessionToken, session.expiresAt);

		redirect(302, '/');
	}
};
