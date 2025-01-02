<script lang="ts">
	import type { Snippet } from 'svelte';
	import { sineIn } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	type Props = {
		children: Snippet;
		open: boolean;
	};

	let { children, open = $bindable(false) }: Props = $props();
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		role="presentation"
		class="fixed top-0 start-0 z-50 w-full h-full"
		onclick={() => (open = false)}
	></div>
	<div
		class="w-full fixed inset-x-0 bottom-0 z-50 p-1 rounded-t-[10px] overflow-y-auto bg-background"
		transition:fly={{ y: 320, duration: 200, easing: sineIn }}
	>
		{@render children()}
	</div>
{/if}
