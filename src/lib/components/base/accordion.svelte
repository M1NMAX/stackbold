<script lang="ts" generics="IsMulti extends boolean = false">
	import type { Snippet } from 'svelte';
	import { setAccordionState } from '$lib/states/index.js';
	import { tm } from '$lib/utils/index.js';

	type Props<T extends boolean = false> = {
		isMulti?: T;
		value?: T extends true ? string[] : string;
		children: Snippet;
		class?: string;
	};

	let { isMulti = false as IsMulti, value, children, class: className }: Props<IsMulti> = $props();
	const accordionState = setAccordionState(isMulti);

	$effect(() => {
		if (isMulti && value) {
			accordionState.openAll(value as string[]);
		} else if (value) {
			accordionState.open(value as string);
		}
	});
</script>

<div class={tm(className)}>
	{@render children()}
</div>
