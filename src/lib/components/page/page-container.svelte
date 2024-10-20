<script lang="ts">
	import { type Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children: Snippet;
		class?: string;
	};
	let { children, class: className }: Props = $props();
</script>

<main
	class={cn(
		'grow h-full flex flex-col space-y-1 rounded-md bg-card text-secondary-foreground overflow-hidden',
		className
	)}
>
	{@render children()}
</main>
