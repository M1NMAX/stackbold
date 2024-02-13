import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { signInSchema } from '$lib/schema';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession();

	if (session) redirect(302, '/');

	const form = await superValidate(signInSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await superValidate(request, signInSchema);

		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;

		const { error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return message(form, error.message);
		}

		redirect(302, '/');
	}
};
