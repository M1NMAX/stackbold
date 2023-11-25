<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import Button from './ui/button/button.svelte';
	import { PanelLeft } from 'lucide-svelte';

	const sidebarState = getContext<Writable<boolean>>('sidebarStateStore');
</script>

<div class="flex items-center space-x-1.5">
	{#if !$sidebarState}
		<Button variant="secondary" size="icon" on:click={() => ($sidebarState = true)} class="mr-2">
			<PanelLeft class="icon-sm" />
			<span class="sr-only"> Show sidebar</span>
		</Button>
	{/if}

	<slot />
</div>
