import { prisma } from './prisma.js';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';

import type { User } from './user.js';
import type { Session, Role } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';

type SessionData = {
	userId: string;
	role: Role;
	twoFactorVerified: boolean;
};

export function generateSessionToken() {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

export async function createSession(token: string, data: SessionData) {
	return await prisma.session.create({
		data: {
			token: encodeHexLowerCase(sha256(new TextEncoder().encode(token))),
			userId: data.userId,
			role: data.role,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
			twoFactorVerified: data.twoFactorVerified
		}
	});
}

export async function validateSessionToken(token: string) {
	const result = await prisma.session.findUnique({
		where: { token: encodeHexLowerCase(sha256(new TextEncoder().encode(token))) },
		include: { user: true }
	});

	if (result === null) return { session: null, user: null };

	const { user, ...session } = result;
	if (Date.now() >= session.expiresAt.getTime()) {
		await prisma.session.delete({ where: { token: session.token } });
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await prisma.session.update({
			where: { id: session.id },
			data: { expiresAt: session.expiresAt }
		});
	}
	return {
		session,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			emailVerified: user.emailVerified,
			registered2FA: user.totpKey != null
		}
	};
}

export async function setSessionAs2FAVerified(sessionId: string) {
	await prisma.session.update({ where: { id: sessionId }, data: { twoFactorVerified: true } });
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await prisma.session.delete({ where: { id: sessionId } });
}

export async function invalidateUserSessions(userId: string): Promise<void> {
	await prisma.session.deleteMany({ where: { userId: userId } });
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };

// COOKIES
export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set('session', token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.set('session', '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/'
	});
}
