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
		'h-10 grow flex items-center justify-center whitespace-nowrap rounded-t-md px-2 py-1.5 font-semibold transition-all',
		tabsState.isSelected(value) && 'bg-secondary shadow-sm border-b-2 border-primary'
	)}
>
	{@render children()}
</button>
