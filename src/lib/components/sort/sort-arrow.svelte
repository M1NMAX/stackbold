<script lang="ts">
	import type { OrderType } from '$lib/utils/sort';
	import { ArrowDown, ArrowUp } from 'lucide-svelte';

	type Props = {
		order: OrderType;
	};

	let { order = $bindable() }: Props = $props();
</script>

{#if order === 'asc'}
	<ArrowDown class="icon-xxs" />
{:else}
	<ArrowUp class="icon-xxs" />
{/if}
