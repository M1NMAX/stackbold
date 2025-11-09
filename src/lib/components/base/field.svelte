<script lang="ts">
	import { tm } from '$lib/utils/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
		errors?: string[] | undefined;
	};

	let { children, class: className, errors }: Props = $props();
</script>

<div
	class={tm(
		'flex flex-col gap-y-0.5 rounded-md py-1.5 text-secondary-foreground bg-secondary focus-within:bg-secondary/80',
		className
	)}
>
	{@render children()}
</div>

{#if errors}
	<div class="text-error">{errors}</div>
{/if}
