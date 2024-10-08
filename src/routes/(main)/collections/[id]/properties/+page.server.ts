import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		insidePanel: false
	};
};
