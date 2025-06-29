<script lang="ts">
	import Rows from 'lucide-svelte/icons/rows-3';
	import {
		AdaptiveWrapper,
		buttonVariants,
		RadioGroup,
		RadioGroupItem,
		Label,
		MenuTitle
	} from '$lib/components/base/index.js';
	import { getPropertyState, PropertyIcon } from '$lib/components/property';
	import { ModalState } from '$lib/states/index.js';
	import { useId } from '$lib/utils';
	import { FILTERABLE_PROPERTY_TYPES } from '$lib/constant/index.js';

	type Props = {
		value: string;
		updValue: (propId: string) => void;
	};

	let { value, updValue }: Props = $props();
	const propertyState = getPropertyState();
	const menuState = new ModalState();

	let properties = $derived.by(() =>
		propertyState.properties.filter((prop) => FILTERABLE_PROPERTY_TYPES.includes(prop.type))
	);

	function handleChange(value: string) {
		updValue(value === 'none' ? '' : value);
		menuState.close();
	}
</script>

<AdaptiveWrapper
	bind:open={menuState.isOpen}
	triggerClass={buttonVariants({ theme: 'secondary' })}
	floatingAlign="end"
>
	{#snippet trigger()}
		<Rows class="block md:hidden" />
		<span class="hidden md:block"> Group by </span>
	{/snippet}
	<MenuTitle title="Group by" />
	<RadioGroup value={value ?? 'none'} onchange={handleChange}>
		{#each properties as property (property.id)}
			{@const id = useId(`group-by-${property.id}`)}
			<Label for={id} compact hoverEffect>
				<PropertyIcon key={property.type} />
				<span class="grow"> {property.name} </span>
				<RadioGroupItem {id} value={property.id} />
			</Label>
		{/each}
		<Label for="collection-group-by-none" compact hoverEffect>
			<PropertyIcon key="none" />
			<span class="grow">None</span>
			<RadioGroupItem id="collection-group-by-none" value="none" />
		</Label>
	</RadioGroup>
</AdaptiveWrapper>
