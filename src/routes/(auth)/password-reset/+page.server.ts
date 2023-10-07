import { fail } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import { generatePasswordResetToken } from '$lib/server/token';
import { sendPasswordResetLink } from '$lib/server/email';
import { prisma } from '$lib/server/prisma';
import { z } from 'zod';
import { message, superValidate } from 'sveltekit-superforms/server';

import type { PageServerLoad, Actions } from './$types';

const emailSchema = z.object({
	email: z.string().email()
});

export const load: PageServerLoad = async () => {
	const form = await superValidate(emailSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, emailSchema);

		if (!form.valid) return fail(400, { form });

		const { email } = form.data;

		try {
			const storedUser = await prisma.user.findUnique({ where: { email } });

			if (!storedUser) return message(form, 'User does not exist');

			const user = auth.transformDatabaseUser(storedUser);
			const token = await generatePasswordResetToken(user.userId);
			await sendPasswordResetLink(token);

			return message(form, 'Success, Your password reset link was sent to your inbox ');
		} catch (e) {
			return message(form, 'An unknown error occured');
		}
	}
};
