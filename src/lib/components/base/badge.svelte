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
		'w-fit h-6 lg:h-5 flex items-center gap-x-1 px-1 rounded-sm font-semibold text-sm [&_svg]:size-3.5',
		THEME_COLORS[color],
		className
	)}
>
	{@render children()}
</span>
