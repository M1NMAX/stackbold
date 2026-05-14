<script lang="ts">
	import { getTabsState } from '$lib/states/index.js';
	import { tm } from '$lib/utils/index.js';
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
	class={tm(
		'h-10 lg:h-9 flex items-center justify-center py-1.5 px-2.5 whitespace-nowrap font-semibold border-2 rounded-lg shadow-sm transition-all hover:bg-secondary/70',
		tabsState.isSelected(value) ? 'bg-secondary' : 'text-muted-foreground'
	)}
>
	{@render children()}
</button>
