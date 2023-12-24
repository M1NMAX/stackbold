<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '../ui/button';
	import { PanelLeft } from 'lucide-svelte';
	import { getSidebarState } from '../sidebar';

	let className: string | undefined = undefined;
	export { className as class };

	const sidebarState = getSidebarState();
</script>

<div class={cn('h-full w-full mx-auto p-2 lg:p-8 space-y-2 overflow-y-auto', className)}>
	{#if !$sidebarState}
		<Button variant="ghost" size="icon" on:click={() => ($sidebarState = true)} class="mr-2">
			<PanelLeft class="icon-sm" />
			<span class="sr-only"> Show sidebar</span>
		</Button>
	{/if}
	<slot />
</div>
