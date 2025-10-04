<script lang="ts">
	import { CheckSquare2, Square } from 'lucide-svelte';
	import { PropertyType, type Color, type Property } from '@prisma/client';
	import { PROPERTY_COLORS } from '$lib/constant/index.js';
	import { tm, useId } from '$lib/utils/index.js';
	import { getOption, hasOptions, PropertyIcon } from './index.js';
	import { Tooltip } from '$lib/components/base/index.js';

	type Props = {
		property: Property;
		color: Color;
		value: string;
	};

	let { property, color, value }: Props = $props();
</script>

{#if property.type === PropertyType.CHECKBOX}
	<div
		class={tm(
			'h-6 flex items-center space-x-1 py-1 px-1.5 rounded-sm font-semibold [&_svg]:size-4',
			PROPERTY_COLORS[color]
		)}
	>
		{#if value === 'true'}
			<CheckSquare2 />
		{:else}
			<Square />
		{/if}

		<span class="font-semibold">{property.name} </span>
	</div>
{:else}
	{@const tooltipId = useId(`template-prop-tooltip-${property.id}`)}
	{@const result = hasOptions(property.type)
		? (getOption(property.options, value)?.value ?? '')
		: value}
	<span
		id={tooltipId}
		class={tm(
			'h-6 flex items-center p-1.5 rounded-sm font-semibold truncate',
			PROPERTY_COLORS[color]
		)}
	>
		{#if property.type !== PropertyType.TEXT}
			{result}
		{:else}
			{result.substring(0, 55)}
		{/if}
	</span>

	<Tooltip triggerBy={tooltipId}>
		<div class="flex items-center p-1">
			<PropertyIcon key={property.type} class="size-4 mr-1" />
			<span class="text-sm font-semibold">{property.name}</span>
		</div>
	</Tooltip>
{/if}
