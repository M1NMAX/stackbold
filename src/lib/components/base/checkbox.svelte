<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Check from 'lucide-svelte/icons/check';
	import { tm } from '$lib/utils/index.js';

	type Props = HTMLInputAttributes & {
		children: Snippet;
		class?: string;
	};

	let { checked = $bindable(), children, class: classNmae, ...rest }: Props = $props();
</script>

<label
	class={tm(
		'h-9 lg:h-7 flex justify-between items-center gap-x-1.5 rounded-none lg:rounded-sm py-1 px-2 lg:py-1.5 lg:px-1 text-sm outline-none hover:bg-secondary hover:text-secondary-foreground cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&svg]:shrink-0'
	)}
>
	<input type="checkbox" class="sr-only" bind:checked {...rest} />

	{@render children()}

	{#if checked}
		<Check />
	{/if}
</label>
