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
	};

	let { value, triggers, children, class: className }: Props = $props();

	setTabsState(value);
</script>

<div class={tm('flex flex-col', className)}>
	<div
		role="tablist"
		class="max-w-fit bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1"
	>
		{@render triggers()}
	</div>

	{@render children()}
</div>
