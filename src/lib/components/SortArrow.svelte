<script lang="ts">
	import type { OrderType } from '$lib/utils';
	import { ArrowDownOutline, ArrowUpOutline } from 'flowbite-svelte-icons';

	export let order: OrderType = 'asc';
</script>

{#if order === 'asc'}
	<ArrowDownOutline size="xs" />
{:else}
	<ArrowUpOutline size="xs" />
{/if}
