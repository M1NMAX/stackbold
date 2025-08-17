<script lang="ts">
	import type { View } from '@prisma/client';
	import { tm } from '$lib/utils/index.js';
	import { Label, RadioGroup, RadioGroupItem } from '$lib/components/base/index.js';
	import { VIEW_ICONS } from '$lib/constant/index.js';

	type Props = {
		views: View[];
		value: string;
		class?: string;
		onchange: (v: string) => void;
	};

	let { views, value, onchange, class: className }: Props = $props();
</script>

<RadioGroup {value} {onchange} class={tm('h-9 flex gap-0.5 rounded-sm bg-secondary/55', className)}>
	{#each views as view}
		{@const Icon = VIEW_ICONS[view.type.toLowerCase()]}

		<Label
			for={`view-${view.id}`}
			class={tm(
				'flex items-center justify-center p-1.5 rounded-sm text-secondary-foreground cursor-pointer',
				+value === view.shortId && 'bg-secondary'
			)}
		>
			<RadioGroupItem value={view.shortId.toString()} id={`view-${view.id}`} class="sr-only" />
			<Icon />
		</Label>
	{/each}
</RadioGroup>
