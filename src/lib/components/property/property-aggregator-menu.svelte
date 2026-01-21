<script lang="ts">
	import {
		AdaptiveWrapper,
		buttonVariants,
		Label,
		RadioGroup,
		RadioGroupItem
	} from '$lib/components/base/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { isPropertyNumerical, tm, useId } from '$lib/utils/index.js';
	import {
		NUMBERICAL_PROPERTY_EXCLUSIVE_AGGREGATORS,
		PROPERTY_AGGREGATOR_LABELS,
		PROPERTY_UNIVERSAL_AGGREGATORS,
		VALUE_NONE
	} from '$lib/constant/index.js';
	import type { Aggregator, Property } from '@prisma/client';
	import type { Nullable } from '$lib/types.js';

	type Props = {
		property: Property;
		calculated: string;
		onchange: (aggregator: Nullable<Aggregator>) => void;
	};

	let { property, calculated, onchange }: Props = $props();
	const menuState = new ModalState();

	function handleChange(v: string) {
		onchange(v ? (v as Aggregator) : null);
		menuState.close();
	}
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
		{#if !calculated || !property.aggregator}
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

	<RadioGroup value={property.aggregator ?? ''} onchange={handleChange}>
		<Label for="property-aggregator-menu-none" compact hoverEffect>
			<span class="grow"> {VALUE_NONE}</span>
			<RadioGroupItem id="property-aggregator-menu-none" value=""></RadioGroupItem>
		</Label>
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
