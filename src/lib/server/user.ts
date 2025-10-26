import { Role } from '@prisma/client';
import { hashPassword } from './password';
import { prisma } from './prisma';
import { generateRandomRecoveryCode } from './utils';
import { encryptString } from './encryption';

export interface User {
	id: string;
	email: string;
	name: string;
	role: Role;
	emailVerified: boolean;
	registered2FA: boolean;
}

export async function createUser(name: string, email: string, password: string) {
	const passwordHash = await hashPassword(password);
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedCode = encryptString(recoveryCode);

	const created = await prisma.user.create({
		data: {
			name,
			email,
			password: passwordHash,
			recoveryCode: encryptedCode
		},
		select: { id: true }
	});

	const user: User = {
		id: created.id,
		name,
		email,
		role: Role.MEMBER,
		emailVerified: false,
		registered2FA: false
	};

	return user;
}

export async function getUserByEmail(email: string) {
	return await prisma.user.findUnique({ where: { email } });
}

export async function updateUserPassword(userId: string, password: string) {
	const passwordHash = await hashPassword(password);

	return await prisma.user.update({
		where: { id: userId },
		data: { password: passwordHash }
	});
}

export async function setUserEmailAsVerified(userId: string, email: string) {
	await prisma.user.update({
		where: { id: userId, email },
		data: { emailVerified: true }
	});
}

export async function setUserAsEmailVerifiedIfEmailMatches(userId: string, email: string) {
	const result = await prisma.user.update({
		where: { id: userId, email },
		data: { emailVerified: true }
	});
	return result != null;
}
