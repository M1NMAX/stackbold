<script lang="ts">
	import { CheckSquare2, Square } from 'lucide-svelte';
	import { PropertyType, type Color, type Property } from '@prisma/client';
	import { THEME_COLORS } from '$lib/constant/index.js';
	import { getOption, hasOptions, tm, useId } from '$lib/utils/index.js';
	import { PropertyIcon } from './index.js';
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
			THEME_COLORS[color]
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
		class={tm('h-6 flex items-center p-1.5 rounded-sm font-semibold truncate', THEME_COLORS[color])}
	>
		{#if property.type !== PropertyType.TEXT}
			{result}
		{:else}
			{result.substring(0, 55)}
		{/if}
	</span>

	<Tooltip triggerBy={tooltipId}>
		<PropertyIcon key={property.type} class="size-4" />
		<span>{property.name}</span>
	</Tooltip>
{/if}
