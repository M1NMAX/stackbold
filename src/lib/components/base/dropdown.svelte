<script lang="ts">
	import { escapeKeydown } from '$lib/actions/index.js';
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';

	type Props = {
		children: Snippet;
		open: boolean;
		alignEnd?: boolean;
		class?: string;
		onClose?: () => void;
	};

	let {
		children,
		open = $bindable(false),
		alignEnd = false,
		class: className,
		onClose
	}: Props = $props();

	function close() {
		open = false;
		if (onClose) onClose();
	}
</script>

<div tabindex="-1" role="menu" use:escapeKeydown onescapekey={close} class="relative outline-0">
	{#if open}
		<div role="presentation" class="fixed top-0 start-0 z-50 w-full h-full" onclick={close}></div>
		<div
			transition:fly={{ duration: 150, y: 3 }}
			class={[
				'absolute top-[100%] z-50 min-w-[15rem] flex flex-col space-y-1 p-1 overflow-hidden rounded bg-popover',
				alignEnd ? 'right-0 left-auto' : 'right-auto left-0',
				className
			]}
		>
			{@render children()}
		</div>
	{/if}
</div>
