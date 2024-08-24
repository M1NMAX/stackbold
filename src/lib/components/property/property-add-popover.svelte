<script lang="ts">
	import { PropertyIcon } from '.';
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { PropertyType } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';
	import { getScreenState } from '$lib/components/view';
	import { clickOutside } from '$lib/actions';
	import { Plus } from 'lucide-svelte';

	let isOpen = false;

	const isDesktop = getScreenState();
	const dispatch = createEventDispatcher<{
		clickPropType: PropertyType;
	}>();

	function handleClickPropertyType(propertyType: PropertyType) {
		dispatch('clickPropType', propertyType);
		isOpen = false;
	}
</script>

{#if $isDesktop}
	{#if isOpen}
		<div class="w-full" use:clickOutside on:clickoutside={() => (isOpen = false)}>
			<div class="grid grid-cols-3 gap-1 p-1 rounded-sm bg-secondary/40">
				{#each Object.values(PropertyType) as propertyType}
					<Button
						variant="secondary"
						on:click={() => handleClickPropertyType(propertyType)}
						class="h-8 w-full justify-start space-x-1.5 rounded-sm"
					>
						<PropertyIcon key={propertyType} />

						<span>
							{capitalizeFirstLetter(propertyType)}
						</span>
					</Button>
				{/each}
			</div>
		</div>
	{/if}
	<Button
		variant="secondary"
		class="w-full"
		on:click={() => {
			isOpen = !isOpen;
		}}
	>
		<Plus class="icon-sm" />
		<span> New property </span>
	</Button>
{:else}
	<Drawer.Root>
		<Drawer.Trigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" class="w-full">
				<Plus class="icon-sm" />
				<span> Add a property </span>
			</Button>
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Header class="py-2 font-semibold">Type</Drawer.Header>

			<Drawer.Footer class="pt-2">
				{#each Object.values(PropertyType) as propertyType}
					<Button
						variant="secondary"
						on:click={() => handleClickPropertyType(propertyType)}
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
