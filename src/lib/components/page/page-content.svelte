<script lang="ts">
	import { cn } from '$lib/utils';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { Button } from '../ui/button';
	import { PanelLeft } from 'lucide-svelte';

	let className: string | undefined = undefined;
	export { className as class };

	const sidebarState = getContext<Writable<boolean>>('sidebarStateStore');
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
