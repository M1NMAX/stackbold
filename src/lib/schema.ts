import { Role } from '@prisma/client';
import { z } from 'zod';

export const updNameSchema = z.object({
	name: z
		.string()
		.min(6, { message: 'Name must be at least 6 character long' })
		.max(100, { message: 'Name must be at most 255 characters long' })
});

export const passwordSchema = z.object({
	password: z
		.string()
		.min(8, { message: 'Password must be at least 8 character long' })
		.max(255, { message: 'Password must be at most 255 characters long' })
});

export const signInSchema = passwordSchema.extend({
	email: z.email()
});

export const signUpSchema = passwordSchema.extend({
	email: z.email(),
	name: updNameSchema.shape.name
});

export const recoveryCodeSchema = z.object({
	code: z.string().length(16, { message: 'Code exceeds 16 character limit' })
});

export const totpCodeSchema = z.object({
	code: z.string().length(6, { message: 'Code exceeds 6 character limit' })
});

export const emailCodeSchema = z.object({
	code: z.string().length(8, { message: 'Code exceeds 8 character limit' })
});

export const twoFactorSetupSchema = totpCodeSchema.extend({
	key: z.string().length(28)
});

export const updPasswordSchema = z.object({
	newPassword: passwordSchema.shape.password,
	currentPassword: passwordSchema.shape.password
});

export const updEmailSchema = z.object({
	email: z.email()
});

export const createUserSchema = passwordSchema.extend({
	name: z.string().min(4).max(31),
	email: z.email(),
	role: z.enum(Role).optional()
});

export function getNameSchema({
	min = 1,
	max = 20,
	label = 'name'
}: {
	min?: number;
	max?: number;
	label?: string;
}) {
	return z
		.string()
		.min(min, { message: `${label} must be at least ${min} character long` })
		.max(max, { message: `${label} must be at most ${max} characters long` });
}
