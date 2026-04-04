<script lang="ts">
	import { tm } from '$lib/utils/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
		errors?: string[] | undefined;
		onclick?: () => void;
	};

	let { children, class: className, errors, onclick }: Props = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	onclick={() => onclick?.()}
	class={tm(
		'flex flex-col gap-y-0.5 rounded-md py-1.5 text-secondary-foreground bg-secondary/60 focus-within:bg-secondary/80',
		className
	)}
>
	{@render children()}
</div>

{#if errors}
	<div class="text-error">{errors}</div>
{/if}
