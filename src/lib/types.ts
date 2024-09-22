import type { Color } from '@prisma/client';
import type { RouterInputs } from '$lib/trpc/router';

export type Colors = { [key in Color]?: string };

export type Size = 'xxs' | 'xs';
export type Sizes = {
	[key in Size]: string;
};

export type DeleteDetail =
	| { type: null }
	| { type: 'item' | 'property'; id: string }
	| { type: 'option'; id: string; option: string }
	| { type: 'collection' | 'user'; id: string; name: string }
	| { type: 'group'; id: string; name: string; includeCollections: boolean };

export type UpdOption = RouterInputs['collections']['updatePropertyOption']['property']['option'];

export type UpdProperty = RouterInputs['collections']['updateProperty']['property'];
