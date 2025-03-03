<script lang="ts">
	import { getScreenSizeState } from '$lib/components/screen';
	import { Dialog } from '$lib/components/base/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		isOpen: boolean;
	};
	let { children, isOpen = $bindable(false) }: Props = $props();

	const isLargeScreen = getScreenSizeState();
</script>

<Dialog bind:open={isOpen} title="New item">
	{@render children()}
</Dialog>
