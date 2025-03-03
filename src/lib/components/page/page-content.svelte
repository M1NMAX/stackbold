<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		children: Snippet;
		onScroll?: (e: Event) => void;
		class?: string;
	};

	let { children, class: className, onScroll }: Props = $props();
</script>

<div
	onscroll={onScroll}
	class={tm(
		'h-full w-full flex flex-col mx-auto pt-0.5 pb-2 px-2  gap-y-2 overflow-y-auto',
		className
	)}
>
	{@render children()}
</div>
