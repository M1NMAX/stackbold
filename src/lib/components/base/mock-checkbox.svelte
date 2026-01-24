<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import Square from 'lucide-svelte/icons/square';

	type Props = {
		checked?: boolean;
	};

	let { checked = false }: Props = $props();
</script>

{#if checked}
	<Check class="stroke-[4px] bg-primary rounded-md" />
{:else}
	<Square />
{/if}
