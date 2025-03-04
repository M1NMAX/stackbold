<script lang="ts">
	import Rows from 'lucide-svelte/icons/rows-3';
	import {
		AdaptiveWrapper,
		buttonVariants,
		HSeparator,
		RadioGroup,
		RadioGroupItem,
		Label,
		MenuTitle
	} from '$lib/components/base/index.js';
	import { getPropertyState, PropertyIcon } from '$lib/components/property';
	import { ModalState } from '$lib/states/index.js';
	import { useId } from '$lib/utils';

	type Props = {
		value: string;
		updValue: (propId: string) => void;
	};

	let { value, updValue }: Props = $props();
	const propertyState = getPropertyState();

	const menuState = new ModalState();

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
		{#each propertyState.properties as property (property.id)}
			{#if property.type === 'SELECT' || property.type === 'CHECKBOX'}
				{@const id = useId(`group-by-${property.id}`)}
				<Label for={id} compact hoverEffect>
					<PropertyIcon key={property.type} />
					<span class="grow"> {property.name} </span>
					<RadioGroupItem {id} value={property.id} />
				</Label>
			{/if}
		{/each}
		<Label for="collection-group-by-none" compact hoverEffect>
			<PropertyIcon key="none" />
			<span class="grow">None</span>
			<RadioGroupItem id="collection-group-by-none" value="none" />
		</Label>
	</RadioGroup>
</AdaptiveWrapper>
