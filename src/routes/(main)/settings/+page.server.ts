import { prisma } from '$lib/server/prisma';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { deleteSessionTokenCookie, invalidateSession } from '$lib/server/session';

const updUserSchema = z.object({
	name: z.string().min(4).max(31),
	email: z.string().email()
});

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) redirect(302, '/signin');

	const form = await superValidate(user, zod(updUserSchema));

	return { user, form };
};
export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}

		await invalidateSession(event.locals.session.id);
		deleteSessionTokenCookie(event);

		redirect(302, '/signin');
	},
	updUserData: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(400);

		const form = await superValidate(request, zod(updUserSchema));

		if (!form.valid) return fail(400, { form });
		const { name } = form.data;

		try {
			await prisma.user.update({ where: { id: user.id }, data: { name } });
			return message(form, 'Accout data updated successfully');
		} catch {
			return message(form, 'Unable to update account data');
		}
	}
};
