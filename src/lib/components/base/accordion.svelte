<script lang="ts">
	import { type AccordionProps, setAccordionState } from '$lib/states/index.js';
	import type { Snippet } from 'svelte';

	type Props = AccordionProps & {
		children: Snippet;
		class?: string;
	};

	let { type: accordionType, value, children, class: className }: Props = $props();

	if (accordionType == 'single') {
		setAccordionState({ type: 'single', value: value as string });
	} else if (accordionType == 'multiple') {
		setAccordionState({ type: 'multiple', value: value as string[] });
	}
</script>

<div class={[className]}>
	{@render children()}
</div>
