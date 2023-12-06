<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import Button from './ui/button/button.svelte';
	import { PanelLeft } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	const sidebarState = getContext<Writable<boolean>>('sidebarStateStore');

	let className: string | undefined = undefined;
</script>

<div class={cn('flex items-center space-x-1.5 p-1', className)}>
	{#if !$sidebarState}
		<Button variant="secondary" size="icon" on:click={() => ($sidebarState = true)} class="mr-2">
			<PanelLeft class="icon-sm" />
			<span class="sr-only"> Show sidebar</span>
		</Button>
	{/if}

	<slot />
</div>
