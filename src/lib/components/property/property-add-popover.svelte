<script lang="ts">
	import Plus from 'lucide-svelte/icons/plus';
	import { getPropertyState, PropertyIcon } from '.';
	import { AdaptiveWrapper, Button, buttonVariants } from '$lib/components/base/index.js';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { PropertyType } from '@prisma/client';
	import { ModalState } from '$lib/states/index.js';
	import { getItemState } from '$lib/components/items';

	const wrapper = new ModalState();
	const propertyState = getPropertyState();
	const itemState = getItemState();

	async function addProperty(propType: PropertyType) {
		if (wrapper.isOpen) wrapper.close();

		await propertyState.addProperty(propType);
		const property = propertyState.getMostRecentProperty(propertyState.properties);
		await itemState.addPropertyRef(property.id);
	}
</script>

<AdaptiveWrapper bind:open={wrapper.isOpen} triggerClass={buttonVariants({ className: 'w-full' })}>
	{#snippet trigger()}
		<Plus />
		<span> New property </span>
	{/snippet}

	<p class="menu-header">Property type</p>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-1">
		{#each Object.values(PropertyType) as propertyType}
			<Button theme="ghost" variant="menu" onclick={() => addProperty(propertyType)}>
				<PropertyIcon key={propertyType} />

				<span>
					{capitalizeFirstLetter(propertyType)}
				</span>
			</Button>
		{/each}
	</div>
</AdaptiveWrapper>
