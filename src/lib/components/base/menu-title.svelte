<script lang="ts">
	import { tm } from '$lib/utils';
	import { HSeparator } from './index.js';

	type Props = {
		title: string;
		class?: string;
		divider?: boolean;
	};

	let { title, class: className, divider = true }: Props = $props();
</script>

<h1
	class={tm(
		'text-center md:text-left py-0.5 px-2 font-bold md:font-semibold text-foreground',
		className
	)}
>
	{title}
</h1>

{#if divider}
	<HSeparator class="hidden md:block" />
{/if}
