import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { dev } from '$app/environment';
import { signUpSchema } from '$lib/schema';
import { generateIdFromEntropySize } from 'lucia';
import { prisma } from '$lib/server/prisma';
import { hash } from "@node-rs/argon2"
import { lucia } from '$lib/server/auth';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { TimeSpan, createDate } from 'oslo';

export const load: PageServerLoad = async ({ locals }) => {
	// if (!dev) redirect(302, '/signin');

	const user = locals.user;
	if (user) {
		redirect(302, '/');
	}

	const form = await superValidate(signUpSchema);
	return { form };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, signUpSchema);

		if (!form.valid) return fail(400, { form });

		const { email, password } = form.data;


		// recommended minimum parameters
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		//TODO: check if username is already used
		const createdUser = await prisma.user.create({
			data: {
				id: generateIdFromEntropySize(10),
				name: email.split("@")[0],
				email: email,
				password: passwordHash
			}
		})


		const verficationCode = await generateEmailVerificationCode(createdUser.id, email);
		await sendEmailVerificationCode(email, verficationCode);
		const session = await lucia.createSession(createdUser.id, {
			role: createdUser.role
		});
		const sessionCookie = lucia.createSessionCookie(session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});

		redirect(302, "/email-verification");
	}
};

async function generateEmailVerificationCode(userId: string, email: string): Promise<string> {
	await prisma.emailVerication.deleteMany({ where: { userId } });

	const code = generateRandomString(8, alphabet("0-9"));

	await prisma.emailVerication.create({
		data: {
			userId,
			email,
			code,
			expiredAt: createDate(new TimeSpan(15, "m"))
		}

	})
	return code;
}


async function sendEmailVerificationCode(email: string, code: string) {
	console.log(`Verficiation code for ${email}: ${code}`);
}
