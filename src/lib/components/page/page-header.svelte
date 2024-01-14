<script lang="ts">
	import { cn } from '$lib/utils';
	import { getSidebarState } from '$lib/components/sidebar';
	import { Button } from '$lib/components/ui/button';
	import { PanelLeft, Menu } from 'lucide-svelte';
	import { mediaQuery } from 'svelte-legos';

	let className: string | undefined = undefined;
	const sidebarState = getSidebarState();
	const isDesktop = mediaQuery('(min-width: 768px)');
</script>

<div class={cn('flex justify-end pb-2', !$sidebarState && 'justify-between', className)}>
	{#if !$sidebarState}
		<Button variant="secondary" size="icon" on:click={() => ($sidebarState = true)} class="mr-2">
			{#if $isDesktop}
				<PanelLeft class="icon-sm" />
				<span class="sr-only"> Show sidebar</span>
			{:else}
				<Menu class="icon-sm" />
				<span class="sr-only"> Go to main menu </span>
			{/if}
		</Button>
	{/if}
	<div class="flex justify-end items-center space-x-1.5">
		<slot />
	</div>
</div>
