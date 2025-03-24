<script lang="ts">
	import { Dialog } from '$lib/components/base/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		isOpen: boolean;
	};
	let { children, isOpen = $bindable(false) }: Props = $props();
</script>

<Dialog bind:open={isOpen} title="New item">
	{@render children()}
</Dialog>
