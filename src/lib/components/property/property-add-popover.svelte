<script lang="ts">
	import { getPropertyState, PropertyIcon } from '.';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Popover from '$lib/components/ui/popover';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { PropertyType } from '@prisma/client';
	import { Plus } from 'lucide-svelte';
	import { ModalState } from '$lib/components/modal';
	import { getScreenSizeState } from '$lib/components/screen';
	import { getItemState } from '$lib/components/items';

	const wrapper = new ModalState();
	const isLargeScreen = getScreenSizeState();
	const propertyState = getPropertyState();
	const itemState = getItemState();

	async function addProperty(propType: PropertyType) {
		if (wrapper.isOpen) wrapper.close();

		console.log('Before properties', propertyState.properties);
		console.log('Before refs', itemState.items[0].properties);
		await propertyState.addProperty(propType);
		const property = propertyState.getMostRecentProperty(propertyState.properties);
		await itemState.addPropertyRef(property.id);

		console.log('After properties', propertyState.properties);
		console.log('After refs', itemState.items[0].properties);
	}
</script>

{#if isLargeScreen.current}
	<Popover.Root bind:open={wrapper.isOpen}>
		<Popover.Trigger class={buttonVariants({ variant: 'default', className: 'w-full' })}>
			<Plus class="icon-sm" />
			<span> New property </span>
		</Popover.Trigger>
		<Popover.Content class="w-full p-1 bg-secondary/40">
			<div class="grid grid-cols-3 gap-1">
				{#each Object.values(PropertyType) as propertyType}
					<Button
						variant="secondary"
						onclick={() => addProperty(propertyType)}
						class="h-8 w-full justify-start space-x-1.5 rounded-sm"
					>
						<PropertyIcon key={propertyType} />

						<span>
							{capitalizeFirstLetter(propertyType)}
						</span>
					</Button>
				{/each}
			</div>
		</Popover.Content>
	</Popover.Root>
{:else}
	<Drawer.Root bind:open={wrapper.isOpen}>
		<Drawer.Trigger class={buttonVariants({ variant: 'default', className: 'w-full' })}>
			<Plus class="icon-sm" />
			<span> New property </span>
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Header class="py-2 font-semibold">New property</Drawer.Header>

			<Drawer.Footer class="pt-2">
				{#each Object.values(PropertyType) as propertyType}
					<Button
						variant="secondary"
						onclick={() => addProperty(propertyType)}
						class="h-8 w-full justify-start space-x-1.5 rounded-sm "
					>
						<PropertyIcon key={propertyType} />

						<span>
							{capitalizeFirstLetter(propertyType)}
						</span>
					</Button>
				{/each}
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
