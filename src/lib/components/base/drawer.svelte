<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tm } from '$lib/utils/index.js';
	import { sineIn } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	type Props = {
		children: Snippet;
		open: boolean;
		class?: string;
	};

	let { children, open = $bindable(false), class: className }: Props = $props();
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		role="presentation"
		class="fixed top-0 start-0 z-50 w-full h-full bg-black/80"
		onclick={() => (open = false)}
	></div>
	<div
		class="w-full fixed inset-x-0 bottom-0 z-50 p-2"
		transition:fly={{ y: 320, duration: 200, easing: sineIn }}
	>
		<div
			class={tm(
				'flex flex-col py-1 rounded-lg overflow-y-auto bg-background border-[1.5px] border-muted',
				className
			)}
		>
			<div class="bg-muted mx-auto mt-1 mb-1.5 h-1 w-[50px] rounded-full"></div>
			{@render children()}
		</div>
	</div>
{/if}
