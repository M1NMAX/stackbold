import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { lucia } from '$lib/server/auth';
import { generateEmailVerificationCode, sendEmailVerificationCode, verifyVerificationCode } from '$lib/server/email';

const codeSchema = z.object({
    code: z.string().length(8)
});

export const load: PageServerLoad = async () => {
    const form = await superValidate(codeSchema);
    return { form };
};

export const actions: Actions = {
    validate: async ({ request, locals, cookies }) => {

        const user = locals.user;
        if (!user) redirect(302, '/')

        const form = await superValidate(request, codeSchema);
        if (!form.valid) return fail(400, { form });

        const { code } = form.data;

        const isValid = await verifyVerificationCode(user, code);
        if (!isValid) return message(form, "Invalid code");

        await lucia.invalidateUserSessions(user.id);
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true }
        });

        const session = await lucia.createSession(user.id, {
            role: user.role
        });

        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies.set(sessionCookie.name, sessionCookie.value, {
            path: ".",
            ...sessionCookie.attributes
        });

        redirect(302, '/')
    },
    resend: async ({ locals }) => {
        const user = locals.user;
        if (!user) return fail(400)
        const form = await superValidate(codeSchema)

        try {
            const verficationCode = await generateEmailVerificationCode(user.id, user.email);
            await sendEmailVerificationCode(user.email, verficationCode);

            return message(form, "A verification code was sent to your email address")
        } catch (error) {
            console.error(error)
            return fail(500, {
                message: "Something went wrong, please try later!"
            })
        }
    }
};