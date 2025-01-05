<script lang="ts">
	import { clickOutside, escapeKeydown } from '$lib/actions';
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';

	type Props = {
		children: Snippet;
		open: boolean;
		class?: string;
	};

	let { children, open = $bindable(false), class: className }: Props = $props();

	function close() {
		open = false;
	}

	function handleClickOutside(e: CustomEvent) {
		const clickTarget = e.detail.target as HTMLElement;
		const menuParent = (e.target as HTMLElement).parentElement?.parentElement;

		if (menuParent && !menuParent.contains(clickTarget)) {
			close();
		}
	}
</script>

<div
	tabindex="-1"
	role="menu"
	class="outline-0"
	use:clickOutside
	onclickoutside={handleClickOutside}
	use:escapeKeydown
	onescapekey={close}
>
	{#if open}
		<div transition:fly={{ duration: 150, y: 3 }} class={className}>
			{@render children()}
		</div>
	{/if}
</div>
