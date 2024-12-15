import { prisma } from './prisma';
import { encodeHex } from 'oslo/encoding';
import { sha256 } from 'oslo/crypto';
import { generateSessionToken } from './session';

export async function createPasswordResetToken(userId: string): Promise<string> {
	// optionally invalidate all existing tokens
	await prisma.passwordResetToken.deleteMany({ where: { userId } });

	const token = generateSessionToken();
	const tokenHash = encodeHex(await sha256(new TextEncoder().encode(token)));

	await prisma.passwordResetToken.create({
		data: {
			userId,
			token: tokenHash,
			expiredAt: new Date(Date.now() + 1000 * 60 * 60)
		}
	});
	return token;
}
