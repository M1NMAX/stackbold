import { z } from 'zod';
export const nameSchema = z
	.string()
	.min(1, { message: 'The name must be at least 1 character long' })
	.max(20, { message: 'The name must be at most 20 characters long' });

export const signInSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6).max(255)
});

export const signUpSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6).max(255)
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
