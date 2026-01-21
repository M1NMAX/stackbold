<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tm } from '$lib/utils/index.js';
	import { Color } from '@prisma/client';
	import { THEME_COLORS } from '$lib/constant';

	type Props = {
		children: Snippet;
		color?: Color;
		class?: string;
		id?: string;
	};

	let { id, children, color = Color.GRAY, class: className }: Props = $props();
</script>

<span
	{id}
	class={tm(
		'h-6 flex items-center gap-x-1.5 px-1 rounded-md font-semibold text-sm [&_svg]:size-4',
		THEME_COLORS[color],
		className
	)}
>
	{@render children()}
</span>
