<script lang="ts">
	import { type Snippet } from 'svelte';
	import { tm } from '$lib/utils';

	type Props = {
		children: Snippet;
		class?: string;
	};
	let { children, class: className }: Props = $props();
</script>

<main
	class={tm(
		'grow h-full flex flex-col gap-y-1 rounded-md bg-card text-secondary-foreground overflow-hidden',
		className
	)}
>
	{@render children()}
</main>
