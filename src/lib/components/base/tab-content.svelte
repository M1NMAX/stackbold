<script lang="ts">
	import { getTabsState } from '$lib/states/index.js';
	import { tm, useId } from '$lib/utils/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		value: string;
		children: Snippet;
		class?: string;
	};

	let { value, children, class: className }: Props = $props();
	const id = useId();
	const tabsState = getTabsState();
</script>

{#if tabsState.isSelected(value)}
	<div {id} role="tabpanel" tabindex="0" class={tm('w-full', className)}>
		{@render children()}
	</div>
{/if}
