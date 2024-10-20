<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<div class={cn('flex items-center justify-start gap-x-2  p-2', className)}>
	{#if children}
		{@render children()}
	{/if}
</div>
