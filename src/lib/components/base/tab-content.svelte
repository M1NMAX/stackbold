<script lang="ts">
	import { getTabsState } from '$lib/states';
	import { useId } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		value: string;
		children: Snippet;
	};

	let { value, children }: Props = $props();
	const id = useId();
	const tabsState = getTabsState();
</script>

{#if tabsState.isSelected(value)}
	<div
		{id}
		role="tabpanel"
		tabindex="0"
		class={[
			'w-full p-4 rounded-md border bg-background ring-offset-background',
			'focus-visible:ring-ring mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
		]}
	>
		{@render children()}
	</div>
{/if}
