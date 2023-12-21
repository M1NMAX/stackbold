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
	import { capitalizeFirstLetter } from '$lib/utils';
	import { PropertyType } from '@prisma/client';

	import { createEventDispatcher } from 'svelte';

	let open = false;
	const dispatch = createEventDispatcher<{
		clickPropType: PropertyType;
	}>();

	function handleClickPropertyType(propertyType: PropertyType) {
		dispatch('clickPropType', propertyType);
		open = false;
	}
</script>

<PopoverRoot bind:open>
	<PopoverTrigger asChild let:builder>
		<Button builders={[builder]} variant="secondary" class="space-x-2">
			<Plus class="icon-sm" />
			<span> Add a property </span>
		</Button>
	</PopoverTrigger>
	<PopoverContent class="w-[200px] space-y-1">
		<p class="px-1 text-sm">Property type</p>

		<div class="space-y-1">
			{#each Object.values(PropertyType) as propertyType}
				<Button
					variant="ghost"
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
	</PopoverContent>
</PopoverRoot>
