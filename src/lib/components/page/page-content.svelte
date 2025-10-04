<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		children: Snippet;
		onscroll?: (e: Event) => void;
		class?: string;
	};

	let { children, class: className, onscroll }: Props = $props();
</script>

<div
	{onscroll}
	class={tm(
		'h-full w-full flex flex-col mx-auto pt-1.5 lg:pt-8 pb-2 px-2 gap-y-2 overflow-x-hidden overflow-y-auto hd-scroll',
		className
	)}
>
	{@render children()}
</div>
