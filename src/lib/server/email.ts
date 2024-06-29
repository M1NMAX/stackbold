import { alphabet, generateRandomString } from "oslo/crypto";
import { prisma } from "./prisma";
import { TimeSpan, createDate, isWithinExpirationDate } from "oslo";
import type { User } from "lucia";

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


export async function sendEmailVerificationCode(email: string, code: string) {
    console.log(`Verficiation code for ${email}: ${code}`);
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