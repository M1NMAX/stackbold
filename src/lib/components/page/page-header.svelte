<script lang="ts">
	import { tm } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<div
	class={tm('flex items-center justify-between gap-x-2 pt-2 md:pt-4 px-2 md:px-4 pb-0', className)}
>
	{@render children()}
</div>
