<script lang="ts">
	import { type Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Props = {
		children?: Snippet;
		class?: string;
	};
	let {children, class: className }: Props = $props();
</script>

<main
	class={cn(
		'h-screen w-full p-0 md:p-1 bg-secondary text-secondary-foreground overflow-hidden',
		className
	)}
>
	<div class="h-full w-full p-2 bg-card rounded-md text-secondary-foreground overflow-hidden">
		{#if children}
			{@render children()}
		{/if}
	</div>
</main>
