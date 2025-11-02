<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue } from 'svelte/elements';
	import { setTabsState } from '$lib/states/index.js';
	import { tm } from '$lib/utils/index.js';

	type Props = {
		value: string;
		triggers: Snippet;
		children: Snippet;
		class?: ClassValue;
		triggersClass?: ClassValue;
	};

	let { value, triggers, children, class: className, triggersClass }: Props = $props();

	setTabsState(value);
</script>

<div class={tm('flex flex-col gap-y-1', className)}>
	<div role="tablist" class={tm('w-full flex rounded-md mb-2 bg-secondary/50', triggersClass)}>
		{@render triggers()}
	</div>

	{@render children()}
</div>
