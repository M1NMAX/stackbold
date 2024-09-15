<script lang="ts">
	import { PropertyIcon } from '.';
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Popover from '$lib/components/ui/popover';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { PropertyType } from '@prisma/client';
	import { getScreenState } from '$lib/components/view';
	import { Plus } from 'lucide-svelte';

	type Props = {
		onClickPropertyType: (type: PropertyType) => void;
	};

	let { onClickPropertyType }: Props = $props();

	let isOpen = $state(false);

	const isDesktop = getScreenState();

	function handleClickPropertyType(propertyType: PropertyType) {
		onClickPropertyType(propertyType);
		isOpen = false;
	}
</script>

{#if $isDesktop}
	<Popover.Root portal="HTMLElement">
		<Popover.Trigger asChild let:builder>
			<Button variant="secondary" class="w-full" builders={[builder]}>
				<Plus class="icon-sm" />
				<span> New property </span>
			</Button>
		</Popover.Trigger>
		<Popover.Content sameWidth={true} class="p-1 bg-secondary/40">
			<div class="grid grid-cols-3 gap-1">
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
		</Popover.Content>
	</Popover.Root>
{:else}
	<Drawer.Root bind:open={isOpen}>
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
