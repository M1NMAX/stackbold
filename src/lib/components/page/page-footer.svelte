<script lang="ts">
	import { tm } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<div class={tm('px-2 md:px-4 pb-2 md:pb-4', className)}>
	{#if children}
		{@render children()}
	{/if}
</div>
