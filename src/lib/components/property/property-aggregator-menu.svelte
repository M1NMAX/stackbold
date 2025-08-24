<script lang="ts">
	import {
		AdaptiveWrapper,
		buttonVariants,
		Label,
		RadioGroup,
		RadioGroupItem
	} from '$lib/components/base/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { tm, useId } from '$lib/utils/index.js';
	import {
		NUMBERICAL_PROPERTY_EXCLUSIVE_AGGREGATORS,
		PROPERTY_AGGREGATOR_LABELS,
		PROPERTY_UNIVERSAL_AGGREGATORS
	} from '$lib/constant/index.js';
	import type { Aggregator, Property } from '@prisma/client';
	import { isPropertyNumerical } from './helper';

	type Props = {
		property: Property;
		calculated: string;
		onchange: (aggregator: Aggregator) => void;
	};

	let { property, calculated, onchange }: Props = $props();
	const menuState = new ModalState();
</script>

<AdaptiveWrapper
	bind:open={menuState.isOpen}
	floatingAlign="end"
	triggerClass={buttonVariants({
		theme: 'ghost',
		variant: 'compact',
		className: tm(!calculated && 'visible md:invisible md:group-hover:visible')
	})}
>
	{#snippet trigger()}
		{#if !calculated}
			<span class="text-sm font-extralight"> Calculate </span>
		{:else}
			<span class="text-sm font-extralight">
				{PROPERTY_AGGREGATOR_LABELS[property.aggregator.toLowerCase()]}
			</span>
			<span class="font-semibold">
				{calculated}
			</span>
		{/if}
	{/snippet}

	<RadioGroup
		value={property.aggregator}
		onchange={(value) => {
			onchange(value as Aggregator);
			menuState.close();
		}}
	>
		{#each PROPERTY_UNIVERSAL_AGGREGATORS as aggregator}
			{@const aggregatorId = useId('property-aggregator-menu')}
			<Label for={aggregatorId} compact hoverEffect>
				<span class="grow"> {PROPERTY_AGGREGATOR_LABELS[aggregator.toLowerCase()]}</span>
				<RadioGroupItem id={aggregatorId} value={aggregator.toString()}></RadioGroupItem>
			</Label>
		{/each}

		{#if isPropertyNumerical(property)}
			{#each NUMBERICAL_PROPERTY_EXCLUSIVE_AGGREGATORS as aggregator}
				{@const aggregatorId = useId('property-aggregator-menu')}

				<Label for={aggregatorId} compact hoverEffect>
					<span class="grow"> {PROPERTY_AGGREGATOR_LABELS[aggregator.toLowerCase()]} </span>
					<RadioGroupItem id={aggregatorId} value={aggregator.toString()}></RadioGroupItem>
				</Label>
			{/each}
		{/if}
	</RadioGroup>
</AdaptiveWrapper>
