import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';

const updUserSchema = z.object({
	name: z.string().min(4).max(31),
	email: z.string().email().nullable()
});

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.getSession();

	if (!session) redirect(302, '/signin');

	const user = session.user;

	const form = await superValidate(updUserSchema);

	return { user, form };
};
export const actions: Actions = {
	logout: async ({ locals }) => {
		await locals.supabase.auth.signOut();

		redirect(302, '/signin');
	},
	updUserData: async ({ request, locals }) => {
		const form = await superValidate(request, updUserSchema);

		if (!form.valid) return fail(400, { form });
		const { name } = form.data;

		const { error } = await locals.supabase.auth.updateUser({ data: { name } });

		if (error) {
			return message(form, error.message);
		}
	}
};
