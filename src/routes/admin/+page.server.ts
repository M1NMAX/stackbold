import type { Actions, PageServerLoad } from './$types';
import { createContext } from '$lib/trpc/context';
import { router } from '$lib/trpc/router';
import { z } from 'zod';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { hashPassword } from '$lib/server/password';
import { generateIdFromEntropySize } from 'lucia';

const signUpSchema = z.object({
	name: z.string().min(4).max(31),
	email: z.string().email(),
	password: z.string().min(6).max(255),
	role: z.enum(['MEMBER', 'ADMIN'])
});

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) redirect(302, '/signin');
	if (user.role !== 'ADMIN') redirect(302, '/');


	const form = await superValidate(signUpSchema);

	const users = await prisma.user.findMany({
		select: {
			id: true,
			name: true,
			email: true,
			emailVerified: true,
			role: true,
			createdAt: true,
			updatedAt: true,
			password: false,
		}
	});

	return { form, users, user };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, signUpSchema);

		if (!form.valid) return fail(400, { form });

		const { name, email, password, role } = form.data;

		const passwordHash = await hashPassword(password);

		const storedUser = await prisma.user.findUnique({ where: { email } })
		if (storedUser) return setError(form, 'email', 'E-mail already exists.');

		await prisma.user.create({
			data: {
				id: generateIdFromEntropySize(10),
				name,
				email,
				role,
				password: passwordHash
			}
		})

		return message(form, 'Feature under revision');
	}
};
