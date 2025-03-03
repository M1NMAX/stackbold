<script lang="ts">
	import { CheckSquare2, Square } from 'lucide-svelte';
	import type { Color, Property } from '@prisma/client';
	import { PROPERTY_COLORS } from '$lib/constant';
	import { tm, useId } from '$lib/utils';
	import { getPropertyValue, PropertyIcon } from '.';
	import { Tooltip } from '$lib/components/base/index.js';

	type Props = {
		property: Property;
		color: Color;
		value: string;
	};

	let { property, color, value }: Props = $props();
</script>

{#if property.type == 'CHECKBOX'}
	<div
		class={tm(
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
	{@const tooltipId = useId(`template-prop-tooltip-${property.id}`)}
	{@const result = getPropertyValue(property, value)}
	<span
		id={tooltipId}
		class={tm('h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold', PROPERTY_COLORS[color])}
	>
		{#if property.type !== 'TEXT'}
			{result}
		{:else}
			{result.substring(0, 55)}
		{/if}
	</span>

	<Tooltip triggerBy={tooltipId}>
		<div class="flex items-center p-1">
			<PropertyIcon key={property.type} class="icon-xs mr-1" />
			<span class="text-sm font-semibold">{property.name}</span>
		</div>
	</Tooltip>
{/if}
