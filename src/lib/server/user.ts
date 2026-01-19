import { Role } from '@prisma/client';
import { hashPassword } from './password';
import { prisma } from './prisma';
import { generateRandomRecoveryCode } from './utils';
import { decrypt, decryptToString, encrypt, encryptString } from './encryption';
import type { createUserSchema } from '$lib/schema';
import type z from 'zod';

export interface User {
	id: string;
	email: string;
	name: string;
	role: Role;
	emailVerified: boolean;
	registered2FA: boolean;
}

export async function createUser(args: z.infer<typeof createUserSchema>) {
	const { name, email, password, role } = args;

	const passwordHash = await hashPassword(password);
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedCode = new Uint8Array(encryptString(recoveryCode));

	const created = await prisma.user.create({
		data: {
			name,
			email,
			role,
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
	const result = await prisma.user.findUnique({
		where: { email },
		select: { id: true, name: true, email: true, role: true, emailVerified: true, totpKey: true }
	});

	if (result == null) return null;
	return { ...result, registered2FA: result.totpKey != null } as User;
}

export async function getUserRecoverCode(userId: string) {
	const result = await prisma.user.findUnique({
		where: { id: userId },
		select: { recoveryCode: true }
	});

	if (result == null) throw new Error('Invalid user id');

	return decryptToString(result.recoveryCode);
}

export async function getUserTOTPKey(userId: string) {
	const result = await prisma.user.findUnique({
		where: { id: userId },
		select: { totpKey: true }
	});

	if (result == null) throw new Error('Invalid user id');
	if (result.totpKey == null) return null;

	return decrypt(result.totpKey);
}

export async function getUserPasswordHash(userId: string) {
	const result = await prisma.user.findUnique({
		where: { id: userId },
		select: { password: true }
	});
	if (result == null) throw new Error('Ivalid user id');
	return result.password;
}

export async function updateUserTOTPKey(userId: string, key: Uint8Array) {
	await prisma.user.update({
		where: { id: userId },
		data: { totpKey: new Uint8Array(encrypt(key)) }
	});
}

export async function updateUserPassword(userId: string, password: string) {
	const passwordHash = await hashPassword(password);

	return await prisma.user.update({
		where: { id: userId },
		data: { password: passwordHash }
	});
}

export async function updateUserName(userId: string, name: string) {
	await prisma.user.update({
		where: { id: userId },
		data: { name }
	});
}
export async function updateUserRecoveryCode(userId: string, recoveryCode: string) {
	return prisma.$transaction(async (tx) => {
		const result = await tx.user.findUnique({
			where: { id: userId },
			select: { recoveryCode: true }
		});
		if (result == null) return false;

		const userRecoveryCode = decryptToString(result.recoveryCode);
		if (recoveryCode !== userRecoveryCode) return false;

		const newRecoveryCode = generateRandomRecoveryCode();
		const encryptedNewRecoveryCode = new Uint8Array(encryptString(newRecoveryCode));

		const user = await tx.user.update({
			where: { id: userId, recoveryCode: result.recoveryCode },
			data: { recoveryCode: encryptedNewRecoveryCode }
		});

		return user != null;
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
