import type { Actions, PageServerLoad } from './$types';
import { z } from 'zod';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { createUser, getUserByEmail } from '$lib/server/user';
import { Role } from '@prisma/client';

const signUpSchema = z.object({
	name: z.string().min(4).max(31),
	email: z.email(),
	password: z.string().min(6).max(255),
	role: z.enum(Role)
});

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) redirect(302, '/signin');
	if (user.role !== Role.ADMIN) redirect(302, '/');

	const form = await superValidate(zod(signUpSchema));

	const users = await prisma.user.findMany({
		select: {
			id: true,
			name: true,
			email: true,
			emailVerified: true,
			role: true,
			createdAt: true,
			updatedAt: true,
			password: false
		}
	});

	return { form, users, user };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(signUpSchema));

		if (!form.valid) return fail(400, { form });

		const { name, email, password, role } = form.data;

		const storedUser = await getUserByEmail(email);
		if (storedUser) return setError(form, 'email', 'E-mail already exists.');

		await createUser(name, email, password, role);

		return message(form, 'Feature under revision');
	}
};
