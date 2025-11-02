import { prisma } from './prisma';
import { encodeHex } from 'oslo/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import { generateRandomOTP } from './utils';
import type { RequestEvent } from '@sveltejs/kit';
import { encodeHexLowerCase } from '@oslojs/encoding';

export async function createPasswordResetToken(token: string, userId: string, email: string) {
	return await prisma.passwordResetSession.create({
		data: {
			userId,
			email,
			token: encodeHex(sha256(new TextEncoder().encode(token))),
			code: generateRandomOTP(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60),
			emailVerified: false,
			twoFactorVerified: false
		}
	});
}

export async function validatePasswordResetSessionToken(token: string) {
	const result = await prisma.passwordResetSession.findUnique({
		where: { token: encodeHexLowerCase(sha256(new TextEncoder().encode(token))) },
		include: { user: true }
	});

	if (result === null) return { session: null, user: null };
	const { user, ...session } = result;

	if (Date.now() >= session.expiresAt.getTime()) {
		await prisma.session.delete({ where: { token: session.token } });
		return { session: null, user: null };
	}

	return { session, user: { ...user, registered2FA: user.totpKey != null } };
}

export async function invalidateUserPasswordResetSessions(userId: string) {
	await prisma.passwordResetSession.deleteMany({ where: { userId } });
}

export async function setPasswordResetSessionAsEmailVerified(sessionId: string) {
	await prisma.passwordResetSession.update({
		where: { id: sessionId },
		data: { emailVerified: true }
	});
}

export async function setPasswordResetSessionAs2FAVerified(sessionId: string) {
	await prisma.passwordResetSession.update({
		where: { id: sessionId },
		data: { twoFactorVerified: true }
	});
}

export async function validatePasswordResetSessionRequest(event: RequestEvent) {
	const token = event.cookies.get('password_reset_session') ?? null;
	if (token === null) return { session: null, user: null };

	const result = await validatePasswordResetSessionToken(token);
	if (result.session === null) deletePasswordResetSessionTokenCookie(event);
	return result;
}

export function setPasswordResetSessionTokenCookie(
	event: RequestEvent,
	token: string,
	expiresAt: Date
) {
	event.cookies.set('password_reset_session', token, {
		expires: expiresAt,
		sameSite: 'lax',
		httpOnly: true,
		path: '/',
		secure: !import.meta.env.DEV
	});
}

export function deletePasswordResetSessionTokenCookie(event: RequestEvent) {
	event.cookies.set('password_reset_session', '', {
		maxAge: 0,
		sameSite: 'lax',
		httpOnly: true,
		path: '/',
		secure: !import.meta.env.DEV
	});
}
