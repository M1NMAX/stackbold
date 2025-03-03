<script lang="ts">
	import { getTabsState } from '$lib/states/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		value: string;
		children: Snippet;
		disabled?: boolean;
	};

	let { value, children, disabled = false }: Props = $props();

	const tabsState = getTabsState();
</script>

<button
	type="button"
	role="tab"
	tabindex={tabsState.isSelected(value) ? 0 : -1}
	{disabled}
	onclick={() => tabsState.setValue(value)}
	class={[
		'ring-offset-background inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
		'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
		'disabled:pointer-events-none disabled:opacity-50',
		tabsState.isSelected(value) && 'bg-background text-foreground shadow-sm'
	]}
>
	{@render children()}
</button>
