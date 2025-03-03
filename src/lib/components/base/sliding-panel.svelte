<script lang="ts">
	import { fly } from 'svelte/transition';
	import { sineIn } from 'svelte/easing';
	import { tm } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		open: boolean;
		class?: string;
		children: Snippet;
	};

	let { open, class: className, children }: Props = $props();
</script>

{#if open}
	<div
		class={tm(
			'w-80 h-full flex flex-col space-y-1.5 p-1.5 ml-1.5 overflow-hidden rounded-md bg-card',
			className
		)}
		transition:fly={{ x: 320, duration: 300, easing: sineIn }}
	>
		{@render children()}
	</div>
{/if}
