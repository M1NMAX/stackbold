import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { dev } from '$app/environment';
import { signUpSchema } from '$lib/schema';

export const load: PageServerLoad = async ({ locals }) => {
	// if (!dev) redirect(302, '/signin');

	const session = await locals.getSession();

	if (session) {
		redirect(302, '/');
	}

	const form = await superValidate(signUpSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, signUpSchema);

		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;

		const { error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: { emailRedirectTo: 'http://localhost:5173/' }
		});

		if (error) {
			return message(form, error.message);
		}

		return message(form, 'A email verification link was sent to your inbox');
	}
};
