<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		children: Snippet;
		class?: string;
	};

	let { children, class: className }: Props = $props();
</script>

<span
	class={tm(
		'h-6 max-w-52 flex items-center gap-x-1.5 px-1 rounded-md font-semibold text-sm [&_svg]:size-4',
		className
	)}
>
	{@render children()}
</span>
