<script lang="ts">
	import type { Snippet } from 'svelte';
	import { buttonVariants, Drawer, Floating } from './index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { useId } from '$lib/utils/index.js';
	import type { Align } from '$lib/types';
	import type { ClassValue } from 'svelte/elements';
	import { SCREEN_LG_MEDIA_QUERY } from '$lib/constant/index.js';

	type Props = {
		id?: string;
		open?: boolean;
		trigger?: Snippet;
		children: Snippet;
		class?: ClassValue;
		triggerClass?: string;
		floatingAlign?: Align;
		floatingClass?: string;
		sameWidth?: boolean;
		customTrigger?: Snippet<[opts: { toggle: () => void }]>;
	};

	let {
		id = useId(),
		open = $bindable(false),
		trigger,
		children,
		class: className,
		triggerClass,
		floatingAlign,
		floatingClass,
		sameWidth,
		customTrigger
	}: Props = $props();

	const isLargeScreen = new MediaQuery(SCREEN_LG_MEDIA_QUERY, false);

	function toggle() {
		if (open) open = false;
		open = true;
	}
</script>

<div class={className}>
	{#if customTrigger}
		{@render customTrigger({ toggle })}
	{:else}
		<button
			{id}
			type="button"
			onclick={toggle}
			class={buttonVariants({ theme: 'ghost', class: triggerClass })}
		>
			{#if trigger}
				{@render trigger()}
			{:else}
				Trigger
			{/if}
		</button>
	{/if}
	{#if isLargeScreen.current}
		<Floating
			bind:visible={open}
			triggerBy={id}
			align={floatingAlign}
			class={floatingClass}
			{sameWidth}
		>
			{@render children()}
		</Floating>
	{:else}
		<Drawer bind:open>
			{@render children()}
		</Drawer>
	{/if}
</div>
