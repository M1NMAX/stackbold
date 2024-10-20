<script lang="ts">
	import { getPropertyState, PropertyIcon } from '.';
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Popover from '$lib/components/ui/popover';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { PropertyType } from '@prisma/client';
	import { Plus } from 'lucide-svelte';

	let isOpen = $state(false);

	const propertyState = getPropertyState();

	function addProperty(propType: PropertyType) {
		if (isOpen) isOpen = false;
		propertyState.addProperty(propType);
	}
</script>

<Popover.Root portal="HTMLElement">
	<Popover.Trigger asChild let:builder>
		<Button builders={[builder]} variant="default" class=" hidden md:flex w-full">
			<Plus class="icon-sm" />
			<span> New property </span>
		</Button>
	</Popover.Trigger>
	<Popover.Content sameWidth={true} class="p-1 bg-secondary/40">
		<div class="grid grid-cols-3 gap-1">
			{#each Object.values(PropertyType) as propertyType}
				<Button
					variant="secondary"
					on:click={() => addProperty(propertyType)}
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
<Drawer.Root bind:open={isOpen}>
	<Drawer.Trigger asChild let:builder>
		<Button builders={[builder]} variant="default" class="md:hidden w-full">
			<Plus class="icon-sm" />
			<span> New property </span>
		</Button>
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header class="py-2 font-semibold">New property</Drawer.Header>

		<Drawer.Footer class="pt-2">
			{#each Object.values(PropertyType) as propertyType}
				<Button
					variant="secondary"
					on:click={() => addProperty(propertyType)}
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
