<script lang="ts">
	import { tm } from '$lib/utils/index.js';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = HTMLTextareaAttributes & {
		value: string;
		minRows?: number;
		maxRows?: number;
		ghost?: boolean;
		xl?: boolean;
	};

	let {
		value = $bindable(''),
		minRows = 1,
		maxRows,
		ghost = false,
		xl = false,
		...rest
	}: Props = $props();

	const minHeight = $derived(`${1 + minRows * 1.2}em`);
	const maxHeight = $derived(maxRows ? `${1 + maxRows * 1.2}em` : `auto`);
</script>

<div class="relative">
	<pre
		aria-hidden="true"
		style:min-height={minHeight}
		style:max-height={maxHeight}
		class={tm(
			'p-2 overflow-hidden text-base box-border border-0 invisible leading-[1.2]',
			xl && 'text-2xl font-semibold'
		)}>{value + '\n'}</pre>
	<textarea
		bind:value
		{...rest}
		class={tm(
			'absolute top-0 h-full w-full flex p-2 box-border border-0 resize-none overflow-hidden rounded-sm text-base shadow-sm bg-transparent leading-[1.2] placeholder:text-muted-foreground',
			'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
			'focus:outline focus:outline-primary focus:outline-offset-0 focus:shadow-none',
			ghost && 'bg-opacity-10 focus:outline-none focus-visible:ring-0',
			xl && 'text-2xl font-semibold'
		)}
	></textarea>
</div>
