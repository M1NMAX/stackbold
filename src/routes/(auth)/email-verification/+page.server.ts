import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { isWithinExpirationDate } from 'oslo';
import { lucia } from '$lib/server/auth';
import type { User } from 'lucia';

const codeSchema = z.object({
    code: z.string()
});

export const load: PageServerLoad = async () => {
    const form = await superValidate(codeSchema);
    return { form };
};

export const actions: Actions = {
    default: async ({ request, locals, cookies }) => {

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
    }
};
async function verifyVerificationCode(user: User, code: string): Promise<boolean> {
    return prisma.$transaction(async (tx) => {

        const storedVericationCode = await tx.emailVerication.findFirst({
            where: { userId: user.id }
        });

        if (!storedVericationCode || storedVericationCode.code !== code) return false;

        await tx.emailVerication.delete({ where: { id: storedVericationCode.id } });

        if (!isWithinExpirationDate(storedVericationCode.expiredAt)) return false;

        if (storedVericationCode.email !== user.email) return false;

        return true;
    });
}