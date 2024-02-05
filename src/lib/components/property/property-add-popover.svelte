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
	<PopoverRoot bind:open>
		<PopoverTrigger asChild let:builder>
			<Button builders={[builder]} variant="secondary">
				<Plus class="icon-sm" />
				<span> Add a property </span>
			</Button>
		</PopoverTrigger>
		<PopoverContent align="start" class="w-64  space-y-1">
			<div>
				<p class="text-center text-base font-semibold">Property type</p>

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
		</PopoverContent>
	</PopoverRoot>
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
