<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Drawer, Floating } from './index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { useId } from '$lib/utils/index.js';
	import type { Align } from '$lib/types';

	type Props = {
		open?: boolean;
		trigger: Snippet;
		children: Snippet;
		triggerClass?: string;
		align?: Align;
	};

	let { open = $bindable(false), trigger, children, triggerClass, align }: Props = $props();

	const id = useId();

	const isLargeScreen = new MediaQuery('min-width: 768px', false);

	function toggle() {
		if (open) open = false;
		open = true;
	}
</script>

<div>
	<button {id} onclick={toggle} class={triggerClass}>
		{@render trigger()}
	</button>

	{#if isLargeScreen.current}
		<Floating bind:visible={open} triggerBy={id} {align}>
			{@render children()}
		</Floating>
	{:else}
		<Drawer bind:open class="space-y-1">
			{@render children()}
		</Drawer>
	{/if}
</div>
