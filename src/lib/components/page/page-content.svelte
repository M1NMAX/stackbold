<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	type Props = {
		children: Snippet;
		class?: string;
		onScroll?: (e: Event) => void;
	};
	let { children, class: className, onScroll }: Props = $props();
</script>

<div
	onscroll={onScroll}
	class={cn('h-full w-full mx-auto pt-0.5 pb-2 px-2  gap-y-2 overflow-y-auto', className)}
>
	{@render children()}
</div>
