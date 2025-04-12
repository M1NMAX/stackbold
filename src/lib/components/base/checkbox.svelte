<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Check from 'lucide-svelte/icons/check';

	type Props = HTMLInputAttributes & {
		children: Snippet;
	};

	let { checked = $bindable(), children, ...rest }: Props = $props();
</script>

<label
	class={[
		'flex justify-between items-center gap-x-1.5 rounded-sm py-1.5 px-2',
		'text-sm outline-none hover:bg-secondary hover:text-secondary-foreground cursor-pointer',
		'[&_svg]:pointer-events-none [&_svg]:size-4 [&svg]:shrink-0'
	]}
>
	<input type="checkbox" class="sr-only" bind:checked {...rest} />

	{@render children()}

	{#if checked}
		<Check />
	{/if}
</label>
