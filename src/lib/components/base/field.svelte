<script lang="ts">
	import { tm } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<div
	class={tm(
		'flex flex-col rounded text-secondary-foreground bg-secondary focus-within:bg-secondary/80',
		className
	)}
>
	{@render children()}
	<div class="bg-red-500"><span class="bg-inherit"> </span></div>
</div>
