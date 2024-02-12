import { z } from 'zod';
export const nameSchema = z
	.string()
	.min(1, { message: 'The name must be at least 1 character long' })
	.max(20, { message: 'The name must be at most 20 characters long' });

export const authSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6).max(255)
});
