import type { PageServerLoad, Actions } from './$types';
import { sendPasswordResetToken } from '$lib/server/email';
import { createPasswordResetToken } from '$lib/server/token';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { zod } from 'sveltekit-superforms/adapters';
import { getUserByEmail } from '$lib/server/user';

const emailSchema = z.object({
	email: z.string().email()
});

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(emailSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(emailSchema));

		if (!form.valid) return fail(400, { form });

		const { email } = form.data;
		const user = await getUserByEmail(email);

		//TODO: Consideration  `If you want to avoid disclosing valid emails`
		if (!user) return fail(200);

		//TODO: implement ip based rate limit
		const token = await createPasswordResetToken(user.id);

		await sendPasswordResetToken(email, token);

		return message(form, 'Success, Your password reset link was sent to your inbox ');
	}
};
