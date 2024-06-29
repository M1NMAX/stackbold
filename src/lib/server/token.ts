import { generateIdFromEntropySize } from "lucia";
import { prisma } from "./prisma";
import { encodeHex } from "oslo/encoding";
import { sha256 } from "oslo/crypto";
import { TimeSpan, createDate } from "oslo";

export async function createPasswordResetToken(userId: string): Promise<string> {
    // optionally invalidate all existing tokens
    await prisma.passwordResetToken.deleteMany({ where: { userId } })

    const tokenId = generateIdFromEntropySize(25); // 40 character
    const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)));

    await prisma.passwordResetToken.create({
        data: {
            userId,
            token: tokenHash,
            expiredAt: createDate(new TimeSpan(2, "h"))
        }
    })
    return tokenId;
}