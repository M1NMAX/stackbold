import type { Color } from '@prisma/client';
import type { RouterInputs } from '$lib/trpc/router';

export type Colors = { [key in Color]?: string };

export type Size = 'xxs' | 'xs';
export type Sizes = {
	[key in Size]: string;
};

export type DeleteDetail =
	| { type: null }
	| { type: 'option'; id: string; option: string; name: string; fun: () => void }
	| {
			type: 'user' | 'group' | 'collection' | 'item' | 'property' | 'option';
			id: string;
			name: string;
			fun: () => void;
	  };

export type MoveCollectionDetail = {
	collectionId: string;
	currentGroupId: string | null;
};
export type UpdOption = RouterInputs['collections']['updatePropertyOption']['property']['option'];

export type UpdProperty = RouterInputs['collections']['updateProperty']['property'];

export type Filter = { id: string; values: string[] };
