import { z } from 'zod';

export const signInSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6).max(255)
});

export const signUpSchema = z.object({
	name: z.string().min(6).max(100),
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
