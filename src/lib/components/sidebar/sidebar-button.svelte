<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { Button } from '../ui/button';
	import { PanelLeft } from 'lucide-svelte';

	const sidebarState = getContext<Writable<boolean>>('sidebarStateStore');
</script>

{#if !$sidebarState}
	<Button variant="secondary" size="icon" on:click={() => ($sidebarState = true)} class="mr-2">
		<PanelLeft class="icon-sm" />
		<span class="sr-only"> Show sidebar</span>
	</Button>
{/if}
