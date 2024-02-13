import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

const emailSchema = z.object({
	email: z.string().email()
});

export const load: PageServerLoad = async () => {
	const form = await superValidate(emailSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, emailSchema);

		if (!form.valid) return fail(400, { form });

		const { email } = form.data;

		// TODO: finish password reset workflow
		const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
			redirectTo: 'http://localhost:5173/password-reset/token'
		});

		if (error) {
			return message(form, error.message);
		}

		return message(form, 'Success, Your password reset link was sent to your inbox ');
	}
};
