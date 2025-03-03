import sequence from 'svelte-sequential-preprocessor';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config}*/
const config = {
	preprocess: sequence([vitePreprocess()]),
	kit: {
		adapter: adapter(),
		alias: {
			'$prisma-zod': 'prisma/generated/zod/index.ts',
			$lib: './src/lib'
		}
	}
};
export default config;
