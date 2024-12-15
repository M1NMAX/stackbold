import { Role } from '@prisma/client';
import { hashPassword } from './password';
import { prisma } from './prisma';

export interface User {
	id: string;
	email: string;
	name: string;
	emailVerified: boolean;
	role: Role;
}

export async function createUser(
	name: string,
	email: string,
	password: string,
	role: Role = Role.MEMBER
) {
	const passwordHash = await hashPassword(password);

	return await prisma.user.create({
		data: {
			name,
			email,
			role,
			password: passwordHash
		}
	});
}

export async function getUserByEmail(email: string) {
	return await prisma.user.findFirst({ where: { email } });
}

export async function updateUserPassword(userId: string, password: string) {
	const passwordHash = await hashPassword(password);

	return await prisma.user.update({
		where: { id: userId },
		data: { password: passwordHash }
	});
}
