<script lang="ts">
	import { tm } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children?: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<div class={tm('flex items-center justify-start gap-x-2 pt-2 px-2 pb-0', className)}>
	{#if children}
		{@render children()}
	{/if}
</div>
