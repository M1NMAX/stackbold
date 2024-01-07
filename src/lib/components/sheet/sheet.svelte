<script lang="ts">
	import type { sheetTransitionParamTypes, sheetTransitionTypes } from '.';
	import { fly, slide, blur, fade } from 'svelte/transition';
	import { sineIn } from 'svelte/easing';
	import { cn } from '$lib/utils';
	import { clickOutside } from '$lib/actions';

	export let id: string = 'drawer-id';
	export let open: boolean = false;

	export let backdrop: boolean = false;
	export let backdropClass: string | undefined = undefined;

	export let activateClickOutside: boolean = false;

	export let leftOffset: string = 'inset-y-0 left-0';
	export let rightOffset: string = 'inset-y-0 right-0';
	export let topOffset: string = 'inset-x-0 top-0';
	export let bottomOffset: string = 'inset-x-0 bottom-0';
	export let placement: 'left' | 'right' | 'top' | 'bottom' = 'right';

	export let transitionType: sheetTransitionTypes = 'fly';
	export let transitionParams: sheetTransitionParamTypes = {
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
		open = !open;
	};

	const handleClickOutside = () => activateClickOutside && open && handleDrawer();

	let backdropDivClass = cn(
		'fixed top-0 left-0 z-50 w-full h-full bg-secondary bg-opacity-75',
		backdropClass
	);
</script>

{#if open}
	{#if backdrop && activateClickOutside}
		<div
			role="presentation"
			on:clickoutside={handleClickOutside}
			use:clickOutside
			on:click={() => open && handleDrawer()}
			class={backdropDivClass}
		/>
	{:else if backdrop && !activateClickOutside}
		<div role="presentation" class={backdropDivClass} />
	{/if}

	<div
		{id}
		{...$$restProps}
		class={cn(
			'fixed w-80 overflow-y-auto z-40 p-4 bg-secondary',
			placements[placement],
			$$props.class
		)}
		transition:multiple={transitionParams}
		tabindex="-1"
		aria-controls={id}
		aria-labelledby={id}
	>
		<slot {open} />
	</div>
{/if}
