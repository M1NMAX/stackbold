<script lang="ts">
	import { tm } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
	//TODO: add error visualizer
</script>

<div
	class={tm(
		'flex flex-col gap-y-0.5 rounded py-1.5 text-secondary-foreground bg-secondary focus-within:bg-secondary/80',
		className
	)}
>
	{@render children()}
</div>
