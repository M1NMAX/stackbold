import { z } from 'zod';
export const nameSchema = z
	.string()
	.min(1, { message: 'The name must be at least 1 character long' })
	.max(20, { message: 'The name must be at most 20 characters long' });
