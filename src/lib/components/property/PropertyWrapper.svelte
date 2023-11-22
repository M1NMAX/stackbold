<script lang="ts">
	import { PropertyType, type CollectionProperty } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';
	import { Copy, EyeOff, FileSignature, MoreHorizontal, Pen, Trash } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Popover from '$lib/components/ui/popover';
	import Options from './Options.svelte';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { Separator } from '$lib/components/ui/separator';

	export let property: CollectionProperty;
	export let isCheckBox: boolean = false;

	const dispatch = createEventDispatcher<{
		duplicate: string;
		delete: string;
		updPropertyField: { pid: string; name: string; value: boolean | string | PropertyType };
	}>();
	let isPopoverOpen = false;

	const handleOnInputPropertyField = (e: Event) => {
		//TODO: correct item value when property change

		const targetEl = e.target as HTMLInputElement;

		const { name, value } = targetEl;

		dispatch('updPropertyField', { pid: property.id, name, value });
	};
</script>

<div class="py-0.5 px-1 rounded bg-gray-100">
	<div class="flex justify-between items-center space-x-1">
		{#if isCheckBox}
			<slot />
		{/if}
		<label
			for={property.id}
			class="grow flex justify-between items-center py-1 px-0.5 font-semibold text-base select-none"
		>
			{property.name}
		</label>

		<Popover.Root bind:open={isPopoverOpen}>
			<!-- TODO: find better solution -->
			<Popover.Trigger class="sr-only">Open</Popover.Trigger>
			<Popover.Content>
				<form class="space-y-1">
					<div class="flex space-x-1.5">
						<label for={`${property.id}-name`} class="font-semibold"> Name </label>
						<input
							id={`${property.id}-name`}
							value={property.name}
							name="name"
							class="grow input input-ghost px-1 font-semibold text-sm bg-base-200"
							on:input={handleOnInputPropertyField}
						/>
					</div>

					<div class="flex space-x-1.5">
						<label for={`${property.id}-type`} class="font-semibold space-x-2.5"> Type </label>
						<select
							id={`${property.id}-type`}
							name="type"
							value={property.type}
							class=" grow select select-ghost px-1 font-semibold text-sm bg-base-200"
							on:input={handleOnInputPropertyField}
						>
							{#each Object.values(PropertyType) as propertyType}
								<option value={propertyType}>
									{capitalizeFirstLetter(propertyType)}
								</option>
							{/each}
						</select>
					</div>

					<Separator />
					{#if property.type === 'SELECT'}
						<Options
							propertyId={property.id}
							options={property.options}
							on:addOpt
							on:deleteOpt
							on:updOptColor
							on:updOptValue
						/>
					{/if}
				</form>
			</Popover.Content>
		</Popover.Root>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button builders={[builder]} variant="ghost" size="xs">
					<MoreHorizontal class="icon-xs" />
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-56">
				<DropdownMenu.Item
					on:click={() => {
						isPopoverOpen = true;
						document.getElementById(`${property.id}-name`)?.focus();
					}}
					class="space-x-1"
				>
					<FileSignature class="icon-xs" />
					<span> Edit property </span>
				</DropdownMenu.Item>

				<DropdownMenu.Group>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger class="space-x-1">
							<EyeOff class="icon-xs" />
							<span>Property visibility</span>
						</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.CheckboxItem
								checked={property.isVisibleOnListView}
								on:click={() => {
									dispatch('updPropertyField', {
										pid: property.id,
										name: 'isVisibleOnListView',
										value: !property.isVisibleOnListView
									});
								}}>List view</DropdownMenu.CheckboxItem
							>

							<DropdownMenu.CheckboxItem
								checked={property.isVisibleOnTableView}
								on:click={() => {
									dispatch('updPropertyField', {
										pid: property.id,
										name: 'isVisibleOnTableView',
										value: !property.isVisibleOnTableView
									});
								}}>Table view</DropdownMenu.CheckboxItem
							>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>

					<DropdownMenu.Item on:click={() => dispatch('duplicate', property.id)} class="space-x-1">
						<Copy class="icon-xs" />
						<span>Duplicate property</span>
					</DropdownMenu.Item>

					<DropdownMenu.Separator />
					<DropdownMenu.Item on:click={() => dispatch('delete', property.id)} class="space-x-1">
						<Trash class="icon-xs" />
						<span>Delete property</span>
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	{#if !isCheckBox}
		<slot />
	{/if}
</div>
