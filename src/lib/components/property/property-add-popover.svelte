<script context="module" lang="ts">
	import { Calendar, CheckSquare2, ChevronsUpDown, Hash, Link, Plus, Text } from 'lucide-svelte';

	const icons: { [index: string]: any } = {
		text: Text,
		select: ChevronsUpDown,
		checkbox: CheckSquare2,
		date: Calendar,
		number: Hash,
		url: Link
	};
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Root as PopoverRoot,
		Trigger as PopoverTrigger,
		Content as PopoverContent
	} from '$lib/components/ui/popover';

	import {
		Root as SheetRoot,
		Trigger as SheetTrigger,
		Content as SheetContent,
		Header as SheetHeader,
		Title as SheetTitle
	} from '$lib/components/ui/sheet';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { PropertyType } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';
	import { getScreenState } from '$lib/components/view';
	import { clickOutside } from '$lib/actions';

	let open = false;

	const isDesktop = getScreenState();
	const dispatch = createEventDispatcher<{
		clickPropType: PropertyType;
	}>();

	function handleClickPropertyType(propertyType: PropertyType) {
		dispatch('clickPropType', propertyType);
		open = false;
	}
</script>

{#if $isDesktop}
	{#if open}
		<div class="w-full" use:clickOutside on:clickoutside={() => (open = false)}>
			<div class="grid grid-cols-3 gap-1 p-1 rounded-sm bg-secondary/40">
				{#each Object.values(PropertyType) as propertyType}
					<Button
						variant="secondary"
						on:click={() => handleClickPropertyType(propertyType)}
						class="h-8 w-full justify-start space-x-1.5 rounded-sm"
					>
						<svelte:component this={icons[propertyType.toLowerCase()]} class="icon-xs" />

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
			open = !open;
		}}
	>
		<Plus class="icon-sm" />
		<span> New property </span>
	</Button>
{:else}
	<SheetRoot>
		<SheetTrigger asChild let:builder>
			<Button builders={[builder]} variant="secondary" class="w-full">
				<Plus class="icon-sm" />
				<span> Add a property </span>
			</Button></SheetTrigger
		>
		<SheetContent side="bottom" class="bg-card px-4">
			<SheetHeader>
				<SheetTitle class="text-center">New property</SheetTitle>
			</SheetHeader>

			<div class="pt-2">
				<p class=" text-base font-semibold pb-2">Type</p>

				<div class="space-y-1">
					{#each Object.values(PropertyType) as propertyType}
						<Button
							variant="secondary"
							on:click={() => handleClickPropertyType(propertyType)}
							class="h-8 w-full justify-start space-x-1.5 rounded-sm "
						>
							<svelte:component this={icons[propertyType.toLowerCase()]} class="icon-xs" />

							<span>
								{capitalizeFirstLetter(propertyType)}
							</span>
						</Button>
					{/each}
				</div>
			</div>
		</SheetContent>
	</SheetRoot>
{/if}
