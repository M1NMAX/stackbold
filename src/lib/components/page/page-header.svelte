<script lang="ts">
	import { cn } from '$lib/utils';
	import { getSidebarState } from '$lib/components/sidebar';
	import { Button } from '$lib/components/ui/button';
	import { Menu } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		class?: string;
	};

	let {children, class: className }: Props = $props();

	const sidebarState = getSidebarState();
</script>

<div class={cn('flex justify-end pb-2', !$sidebarState && 'justify-between', className)}>
	{#if !$sidebarState}
		<Button variant="secondary" size="icon" on:click={() => ($sidebarState = true)} class="mr-2">
			<Menu class="icon-sm" />
			<span class="sr-only"> Show sidebar </span>
		</Button>
	{/if}

	{#if children}
		{@render children()}
	{/if}
</div>
