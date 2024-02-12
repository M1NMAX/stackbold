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
	name: z.string().min(4).max(31),
	email: z.string().email(),
	password: z.string().min(6).max(255)
});
