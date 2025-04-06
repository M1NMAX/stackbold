import type { Color } from '@prisma/client';
import type { RouterInputs } from '$lib/trpc/router';
import type {
	BlurParams,
	FadeParams,
	FlyParams,
	ScaleParams,
	SlideParams,
	TransitionConfig
} from 'svelte/transition';

export type Toast =
	| { id: string; type: 'action'; message: string; action: { label: string; onclick: () => void } }
	| { id: string; type: 'success' | 'error' | 'warning'; message: string };

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
			fun: () => Promise<void>;
	  };

export type MoveCollectionDetail = {
	collectionId: string;
	currentGroupId: string | null;
};
export type UpdOption = RouterInputs['collections']['updatePropertyOption']['property']['option'];

export type UpdProperty = RouterInputs['collections']['updateProperty']['property'];

export type Filter = { id: string; values: string[] };

export type Searchable =
	| {
			id: string;
			name: string;
			type: 'collection';
			updatedAt: Date;
			icon: string;
	  }
	| {
			id: string;
			name: string;
			type: 'item';
			updatedAt: Date;
			collection: {
				id: string;
				name: string;
			};
	  };

export type Align = 'start' | 'center' | 'end';
export type Placement = 'top' | 'right' | 'bottom' | 'left';

export type ParamsType = FadeParams | BlurParams | FlyParams | SlideParams | ScaleParams;
export type TransitionFun = (node: HTMLElement, param: ParamsType) => TransitionConfig;

export type SelectOption = {
	id: string;
	label: string;
	isSelected: boolean;
	icon?: string;
	theme?: string;
};
