<script lang="ts">
	import { Root as RadioGroupRoot, Item as RadioGroupItem } from '$lib/components/ui/radio-group';
	import { cn } from '$lib/utils';
	import { View } from '@prisma/client';
	import { Label } from '$lib/components/ui/label';
	import { StretchHorizontal, Table } from 'lucide-svelte';

	type Props = {
		value: View;
		options: View[];
		class?: string;
	};

	let { value = $bindable(), options, class: className }: Props = $props();
</script>

<RadioGroupRoot
	{value}
	onValueChange={(currentValue) => (value = currentValue as View)}
	class={cn('h-9 flex gap-0.5 rounded-sm bg-secondary/55', className)}
>
	{#each options as option}
		{@const Icon = option == View.LIST ? StretchHorizontal : Table}
		<Label
			for={`view-${option}`}
			class={cn(
				'flex items-center justify-center p-1.5 rounded-sm text-secondary-foreground cursor-pointer',
				value === option && 'bg-secondary'
			)}
		>
			<RadioGroupItem value={option} id={`view-${option}`} class="sr-only" />

			<div class="flex items-center justify-between space-x-2 text-base">
				<Icon class="icon-md" />
			</div>
		</Label>
	{/each}
</RadioGroupRoot>
