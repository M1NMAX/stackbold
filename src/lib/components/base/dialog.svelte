<script lang="ts">
	import X from 'lucide-svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { Button } from '$lib/components/base/index.js';
	import { fade } from 'svelte/transition';
	import { sineIn } from 'svelte/easing';
	import { clickOutside, escapeKeydown } from '$lib/actions/index.js';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		title?: string;
		children: Snippet;
		open: boolean;
		dismissable?: boolean;
		class?: string;
	};

	let {
		title,
		children,
		open = $bindable(false),
		dismissable = true,
		class: className
	}: Props = $props();

	function close() {
		open = false;
	}
</script>

{#if open}
	<div
		transition:fade={{ duration: 100, easing: sineIn }}
		class="fixed left-0 top-0 z-50 w-full h-full flex items-center justify-center bg-black/80"
		tabindex="-1"
	>
		<div
			class={tm(
				'relative w-full max-w-md max-h-full z-50 p-4 border rounded-md shadow-lg bg-background',
				className
			)}
			use:clickOutside
			onclickoutside={close}
			use:escapeKeydown
			onescapekey={close}
		>
			{#if dismissable}
				<Button theme="ghost" variant="compact" class="absolute right-4 top-4" onclick={close}>
					<X />
				</Button>
			{/if}

			{#if title}
				<h3 class="text-lg font-semibold leading-none tracking-tight">{title}</h3>
			{/if}

			{@render children()}
		</div>
	</div>
{/if}
