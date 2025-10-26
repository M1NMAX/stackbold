import { z } from 'zod';

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
	name: z
		.string()
		.min(6, { message: 'Name must be at least 6 character long' })
		.max(100, { message: 'Name must be at most 255 characters long' })
});

export const codeSchema = z.object({
	code: z.string().length(8, { message: 'Code exceeds 8 character limit' })
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
