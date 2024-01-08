<script lang="ts">
	import { cn } from '$lib/utils';
	import { getSidebarState } from '$lib/components/sidebar';
	import { Button } from '$lib/components/ui/button';
	import { PanelLeft } from 'lucide-svelte';

	let className: string | undefined = undefined;
	const sidebarState = getSidebarState();
</script>

<div class={cn('flex justify-end', !$sidebarState && 'justify-between', className)}>
	{#if !$sidebarState}
		<Button variant="secondary" size="icon" on:click={() => ($sidebarState = true)} class="mr-2">
			<PanelLeft class="icon-sm" />
			<span class="sr-only"> Show sidebar</span>
		</Button>
	{/if}
	<div class="flex justify-end items-center space-x-1.5">
		<slot />
	</div>
</div>
