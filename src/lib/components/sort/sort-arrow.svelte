<script lang="ts">
	import type { OrderType } from '$lib/utils/sort';
	import { ArrowDown, ArrowUp } from 'lucide-svelte';

	export let order: OrderType = 'asc';
</script>

{#if order === 'asc'}
	<ArrowDown class="icon-xxs" />
{:else}
	<ArrowUp class="icon-xxs" />
{/if}
