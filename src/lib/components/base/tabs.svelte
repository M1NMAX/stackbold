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

<div class={tm('flex flex-col gap-y-1', className)}>
	<div
		role="tablist"
		class="w-full h-10 flex items-center justify-between px-4 text-muted-foreground"
	>
		{@render triggers()}
	</div>

	{@render children()}
</div>
