<script lang="ts">
	import type { Snippet } from 'svelte';
	import { buttonVariants, Drawer, Floating } from './index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { useId } from '$lib/utils/index.js';
	import type { Align } from '$lib/types';

	type Props = {
		open?: boolean;
		trigger: Snippet;
		children: Snippet;
		triggerClass?: string;
		floatingAlign?: Align;
		floatingClass?: string;
	};

	let {
		open = $bindable(false),
		trigger,
		children,
		triggerClass,
		floatingAlign,
		floatingClass
	}: Props = $props();

	const id = useId();

	const isLargeScreen = new MediaQuery('min-width: 768px', false);

	function toggle() {
		if (open) open = false;
		open = true;
	}
</script>

<div>
	<button {id} onclick={toggle} class={buttonVariants({ theme: 'ghost', className: triggerClass })}>
		{@render trigger()}
	</button>

	{#if isLargeScreen.current}
		<Floating bind:visible={open} triggerBy={id} align={floatingAlign} class={floatingClass}>
			{@render children()}
		</Floating>
	{:else}
		<Drawer bind:open class="space-y-1">
			{@render children()}
		</Drawer>
	{/if}
</div>
