<script lang="ts">
	import StretchHorizontal from 'lucide-svelte/icons/stretch-horizontal';
	import Table from 'lucide-svelte/icons/table';
	import { View } from '@prisma/client';
	import { tm } from '$lib/utils/index.js';
	import { Label, RadioGroup, RadioGroupItem } from '$lib/components/base/index.js';

	type Props = {
		value: View;
		options: View[];
		class?: string;
	};

	let { value = $bindable(), options, class: className }: Props = $props();
</script>

<RadioGroup
	{value}
	onchange={(currValue) => (value = currValue as View)}
	class={tm('h-9 flex gap-0.5 rounded-sm bg-secondary/55', className)}
>
	{#each options as option}
		{@const Icon = option == View.LIST ? StretchHorizontal : Table}
		<Label
			for={`view-${option}`}
			class={tm(
				'flex items-center justify-center p-1.5 rounded-sm text-secondary-foreground cursor-pointer',
				value === option && 'bg-secondary'
			)}
		>
			<RadioGroupItem value={option} id={`view-${option}`} class="sr-only" />

			<Icon />
		</Label>
	{/each}
</RadioGroup>
