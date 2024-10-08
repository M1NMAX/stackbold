<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<aside class={cn('w-64 h-screen z-20 transition-all', className)} aria-label="sidebar">
	{@render children()}
</aside>
