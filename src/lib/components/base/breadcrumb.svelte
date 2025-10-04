<script lang="ts">
	import { tm } from '$lib/utils/index.js';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<div class={tm('grow flex items-center gap-x-1', className)}>
	{@render children()}
</div>
