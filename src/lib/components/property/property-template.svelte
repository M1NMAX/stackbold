<script lang="ts">
	import { createTooltip, melt } from '@melt-ui/svelte';
	import { fade } from 'svelte/transition';
	import { CheckSquare2, Square } from 'lucide-svelte';
	import type { Color, Property } from '@prisma/client';
	import { PROPERTY_COLORS } from '$lib/constant';
	import { cn } from '$lib/utils';
	import { getPropertyValue, PropertyIcon } from '.';

	type Props = {
		property: Property;
		color: Color;
		value: string;
	};

	let { property, color, value }: Props = $props();

	const {
		elements: { trigger, content, arrow },
		states: { open }
	} = createTooltip({
		positioning: {
			placement: 'top'
		},
		portal: 'HTMLElement',
		openDelay: 0,
		closeDelay: 0,
		closeOnPointerDown: false
	});
</script>

{#if property.type == 'CHECKBOX'}
	<div
		class={cn(
			'h-6 flex items-center space-x-1 py-1 px-1.5 rounded-sm font-semibold',
			PROPERTY_COLORS[color]
		)}
	>
		{#if value === 'true'}
			<CheckSquare2 class="icon-xs" />
		{:else}
			<Square class="icon-xs" />
		{/if}

		<span class="font-semibold">{property.name} </span>
	</div>
{:else}
	{@const result = getPropertyValue(property, value)}
	<span
		use:melt={$trigger}
		class={cn('h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold', PROPERTY_COLORS[color])}
	>
		{#if property.type !== 'TEXT'}
			{result}
		{:else}
			{result.substring(0, 55)}
		{/if}
	</span>

	{#if $open}
		<div
			use:melt={$content}
			transition:fade={{ duration: 100 }}
			class="z-10 rounded-lg bg-secondary shadow"
		>
			<div use:melt={$arrow}></div>
			<div class="flex items-center p-1">
				<PropertyIcon key={property.type} class="icon-xs mr-1" />
				<span class="text-sm font-semibold">{property.name}</span>
			</div>
		</div>
	{/if}
{/if}
