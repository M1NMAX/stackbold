<script lang="ts">
	import { tm } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<kbd
	class={tm(
		'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border bg-popover p-2 font-mono text-xs font-medium text-popover-foreground opacity-100',
		className
	)}
>
	{@render children()}
</kbd>
