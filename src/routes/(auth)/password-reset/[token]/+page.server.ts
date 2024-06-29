import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms/server";
import { fail, redirect } from "@sveltejs/kit";
import { encodeHex } from "oslo/encoding";
import { sha256 } from "oslo/crypto";
import { prisma } from "$lib/server/prisma";
import { isWithinExpirationDate } from "oslo";
import { lucia } from "$lib/server/auth";
import { hash } from "@node-rs/argon2"

const passwordSchema = z.object({
    password: z.string().min(6).max(255)
});

export const load: PageServerLoad = async ({ params }) => {
    const form = await superValidate(passwordSchema)
    return { form }
}


export const actions: Actions = {
    default: async ({ request, params, cookies }) => {

        const form = await superValidate(request, passwordSchema);
        if (!form.valid) return fail(400, { form });

        const { password } = form.data;

        const verificationToken = params.token;
        const tokenHash = encodeHex(await sha256(new TextEncoder().encode(verificationToken)));

        const storedToken = await prisma.passwordResetToken.findFirst({ where: { token: tokenHash } })

        if (storedToken) await prisma.passwordResetToken.deleteMany({ where: { token: tokenHash } })

        if (!storedToken || !isWithinExpirationDate(storedToken.expiredAt)) return fail(400);

        await lucia.invalidateUserSessions(storedToken.userId);

        const passwordHash = await hash(password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });
        const updatedUser = await prisma.user.update({
            where: { id: storedToken.userId },
            data: { password: passwordHash }
        })

        const session = await lucia.createSession(storedToken.userId, {
            role: updatedUser.role
        });

        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies.set(sessionCookie.name, sessionCookie.value, {
            path: ".",
            ...sessionCookie.attributes
        })

        redirect(302, "/")
    }
}