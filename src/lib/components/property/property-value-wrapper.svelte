<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		isWrappered: boolean;
		class?: string;
	};
	let { children, isWrappered = false, class: className }: Props = $props();
</script>

{#if !isWrappered}
	{@render children()}
{:else}
	<span class={cn('h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold', className)}>
		{@render children()}
	</span>
{/if}
