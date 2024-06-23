import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { signInSchema } from '$lib/schema';
import { prisma } from '$lib/server/prisma';
import { verify } from "@node-rs/argon2"
import { lucia } from '$lib/server/auth';
import { Role } from '@prisma/client';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (user) redirect(302, '/')

	const form = await superValidate(signInSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, signInSchema);

		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;

		//TODO: Think about brute-force attack
		const storedUser = await prisma.user.findFirst({ where: { email } })
		if (!storedUser) return message(form, "Invalid Credentials")


		const validPassword = await verify(storedUser.password, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		if (!validPassword) return message(form, "Invalid Credentials")

		const session = await lucia.createSession(storedUser.id, {
			role: Role.MEMBER,
		});

		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});


		return redirect(302, "/");


	}
};
