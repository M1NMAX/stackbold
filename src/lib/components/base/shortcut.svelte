<script lang="ts">
	import { tm } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		label?: string;
		class?: string;
	};

	let { children, label, class: className }: Props = $props();
</script>

{#if !label}
	{@render keys()}
{:else}
	<span class="flex items-center gap-x-1.5">
		{@render keys()}
		<span class="text-xs font-medium"> {label} </span>
	</span>
{/if}

{#snippet keys()}
	<kbd
		class={tm(
			'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border bg-popover p-2 font-mono text-xs font-medium text-popover-foreground opacity-100 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-2.5 [&_svg]:shrink-0',
			className
		)}
	>
		{@render children()}
	</kbd>
{/snippet}
