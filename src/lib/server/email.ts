import type { User } from "lucia";
import { alphabet, generateRandomString } from "oslo/crypto";
import { prisma } from "./prisma";
import { TimeSpan, createDate, isWithinExpirationDate } from "oslo";
import sendgrid from "@sendgrid/mail";
import { SENDGRID_API_KEY, SB_EMAIL } from "$env/static/private";
import { dev } from "$app/environment";
import { PUBLIC_DEV_BASE_URL, PUBLIC_PROD_BASE_URL } from "$env/static/public";

export async function generateEmailVerificationCode(userId: string, email: string): Promise<string> {
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

export async function verifyVerificationCode(user: User, code: string): Promise<boolean> {
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

export async function sendEmailVerificationCode(email: string, code: string) {
    sendgrid.setApiKey(SENDGRID_API_KEY)
    const msg = {
        to: email,
        from: SB_EMAIL,
        subject: "Confirm Your Email Address",
        html: `
        <h2>Stackbold - Confirm your email</h2> 
        <p>Please confirm your email address by entering this code: <b> ${code}</b></p>
        <p> Thank you,</p>
        <p> Stackbold </p>
        `,
    };
    sendgrid.send(msg);
}

export async function sendPasswordResetToken(email: string, token: string) {

    let link = dev ? PUBLIC_DEV_BASE_URL : PUBLIC_PROD_BASE_URL;
    link += "password-reset/" + token;

    sendgrid.setApiKey(SENDGRID_API_KEY)
    const msg = {
        to: email,
        from: SB_EMAIL,
        subject: "Password Reset Request",
        html: `
        <h2>Stackbold - password reset</h2> 
        <p>Click the linl bellow to reset your password:</p>
        <a href="${link}">Reset your password</a>
        <p>If you did not request this, please ignore this email</p>
        <p> Thank you,</p>
        <p> Stackbold </p>
        `,
    };
    sendgrid.send(msg);
}