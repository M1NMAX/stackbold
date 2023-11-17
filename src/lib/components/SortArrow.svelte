<script lang="ts">
	import type { OrderType } from '$lib/utils';
	import { ArrowDown, ArrowUp } from 'lucide-svelte';

	export let order: OrderType = 'asc';
</script>

{#if order === 'asc'}
	<ArrowDown class="w-3 h-3" />
{:else}
	<ArrowUp class="w-3 h-3" />
{/if}
