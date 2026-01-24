<script lang="ts">
	import { PropertyType, type Color, type Property } from '@prisma/client';
	import { getOption, hasOptions, useId } from '$lib/utils/index.js';
	import { PropertyIcon } from './index.js';
	import { Badge, MockCheckbox, Tooltip } from '$lib/components/base/index.js';

	type Props = {
		property: Property;
		color: Color;
		value: string;
	};

	let { property, color, value }: Props = $props();

	const tooltipId = useId(`template-prop-tooltip-${property.id}`);
</script>

<Badge id={tooltipId} {color} class="cursor-default">
	{#if property.type === PropertyType.CHECKBOX}
		<MockCheckbox checked={value === 'true'} />
		{property.name}
	{:else}
		{@const result = hasOptions(property.type)
			? (getOption(property.options, value)?.value ?? '')
			: value}
		{result.substring(0, 55)}
	{/if}
</Badge>

{#if property.type !== PropertyType.CHECKBOX}
	<Tooltip triggerBy={tooltipId}>
		<PropertyIcon key={property.type} class="size-4" />
		<span>{property.name}</span>
	</Tooltip>
{/if}
