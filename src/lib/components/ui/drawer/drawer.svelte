<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import type { drawerTransitionParamTypes, drawerTransitionTypes } from '.';
	import { fly, slide, blur, fade } from 'svelte/transition';
	import { sineIn } from 'svelte/easing';

	export let activateClickOutside: boolean = false;
	export let hidden: boolean = true;
	export let position: 'fixed' | 'absolute' = 'fixed';
	export let leftOffset: string = 'inset-y-0 left-0';
	export let rightOffset: string = 'inset-y-0 right-0';
	export let topOffset: string = 'inset-x-0 top-0';
	export let bottomOffset: string = 'inset-x-0 bottom-0';
	export let width: string = 'w-80';
	export let backdrop: boolean = false;
	export let bgColor: string = 'bg-secondary';
	export let bgOpacity: string = 'bg-opacity-75';
	export let placement: 'left' | 'right' | 'top' | 'bottom' = 'right';
	export let id: string = 'drawer-example';
	export let divClass: string = 'overflow-y-auto z-40 p-4 bg-secondary';
	export let transitionType: drawerTransitionTypes = 'fly';
	export let transitionParams: drawerTransitionParamTypes = {
		x: 320,
		duration: 300,
		easing: sineIn
	};

	function multiple(node: HTMLElement, params: any) {
		switch (transitionType) {
			case 'slide':
				return slide(node, params);
			case 'blur':
				return blur(node, params);
			case 'fade':
				return fade(node, params);
			default:
				return fly(node, params);
		}
	}

	const placements = {
		left: leftOffset,
		right: rightOffset,
		top: topOffset,
		bottom: bottomOffset
	};

	const handleDrawer = () => {
		hidden = !hidden;
	};

	const handleClickOutside = () => activateClickOutside && !hidden && handleDrawer();

	let backdropDivClass = twMerge(
		'fixed top-0 left-0 z-50 w-full h-full',
		backdrop && bgColor,
		backdrop && bgOpacity
	);
</script>

{#if !hidden}
	{#if backdrop && activateClickOutside}
		<div role="presentation" class={backdropDivClass} on:click={() => !hidden && handleDrawer()} />
	{:else if backdrop && !activateClickOutside}
		<div role="presentation" class={backdropDivClass} />
	{/if}

	<div
		{id}
		{...$$restProps}
		class={twMerge(divClass, width, position, placements[placement], $$props.class)}
		transition:multiple={transitionParams}
		tabindex="-1"
		aria-controls={id}
		aria-labelledby={id}
	>
		<slot {hidden} />
	</div>
{/if}
