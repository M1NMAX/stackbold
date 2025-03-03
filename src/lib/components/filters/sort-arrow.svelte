<script lang="ts">
	import ArrowDown from 'lucide-svelte/icons/arrow-down';
	import ArrowUp from 'lucide-svelte/icons/arrow-up';
	import type { OrderType } from '$lib/utils/sort';

	type Props = {
		order: OrderType;
	};

	let { order = $bindable() }: Props = $props();
</script>

{#if order === 'asc'}
	<ArrowDown class="size-3" />
{:else}
	<ArrowUp class="size-3" />
{/if}
