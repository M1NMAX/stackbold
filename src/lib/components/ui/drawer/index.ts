import Drawer from './drawer.svelte';

export { Drawer };

export interface drawerTransitionParamTypes {
	amount?: number;
	delay?: number;
	duration?: number;
	easing?: (t: number) => number;
	opacity?: number;
	x?: number;
	y?: number;
}

export type drawerTransitionTypes =
	| 'fade'
	| 'fly'
	| 'slide'
	| 'blur'
	| 'in:fly'
	| 'out:fly'
	| 'in:slide'
	| 'out:slide'
	| 'in:fade'
	| 'out:fade'
	| 'in:blur'
	| 'out:blur'
	| undefined;
