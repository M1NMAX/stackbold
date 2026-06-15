import type { Collection, Color, Item, Property, PropertyOption, Role } from '@prisma/client';
import type { RouterInputs } from '$lib/trpc/router';
import type {
	BlurParams,
	FadeParams,
	FlyParams,
	ScaleParams,
	SlideParams,
	TransitionConfig
} from 'svelte/transition';
import type { HEALTH_STATUS } from './constant';

export type Nullable<T> = T | null;

export type User = {
	id: string;
	email: string;
	name: string;
	role: Role;
	emailVerified: boolean;
	registered2FA: boolean;
};

export interface XUser extends User {
	inAdmin: boolean;
}

export type Toast =
	| { id: string; type: 'action'; message: string; action: { label: string; onclick: () => void } }
	| { id: string; type: 'success' | 'error' | 'warning' | 'loading'; message: string };

export type Colors = { [key in Color]?: string };

export type Size = 'xxs' | 'xs';
export type Sizes = {
	[key in Size]: string;
};

export type DeleteDetail =
	| { type: null }
	| { type: 'option'; id: string; option: string; name: string; fun: () => void }
	| {
			type: 'user' | 'group' | 'collection' | 'view' | 'item' | 'property' | 'option';
			id: string;
			name: string;
			fun: () => Promise<void>;
	  };

export type MoveCollectionDetail = {
	collectionId: string;
	currentGroupId: string | null;
};

export type UpdGroup = RouterInputs['groups']['update'];
export type UpdView = RouterInputs['views']['update'];
export type UpdProperty = RouterInputs['properties']['update'];
export type UpdOption = RouterInputs['properties']['updateOption'];

export type Filter = { id: string; values: string[] };

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

export type SearchableCollectionAsOption =
	| {
			id: string;
			isSelected: boolean;
			name: string;
			icon?: string;
			type: 'collection' | 'item';
			onclick: () => void;
	  }
	| { id: string; name: string; icon?: string; url: string; type: 'collection' | 'item' };

export type SearchableCollection = {
	id: string;
	name: string;
	icon: string;
	views: { shortId: number }[];
	items: { id: string; name: string }[];
};

export type CollectionWithViews = Collection & {
	views: { shortId: number }[];
	_count: { items: number };
};

export type XPropertyOption = PropertyOption & {
	extra?: string;
};

export type PropertyWithOptions = Property & {
	options: XPropertyOption[];
};

export type OnChangeFn<T> = (value: T) => void;

export type ClickItemEvent = MouseEvent & {
	currentTarget: EventTarget & HTMLDivElement;
};

export type ItemsGroup = Record<string, Item[]>;

export type PropertiesSnapshot = { id: string; optionsIds: Map<string, string> };

export type ReadableBox<T> = {
	readonly current: T;
};

export type WritableBox<T> = ReadableBox<T> & {
	current: T;
};

export type HealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];

export type ServiceHealth = {
	name: string;
	status: HealthStatus;
	latency: number;
	error?: string;
};
