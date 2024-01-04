<script lang="ts">
	import { PropertyOptions } from '.';
	import { PropertyType, type Property } from '@prisma/client';
	import { createEventDispatcher, tick } from 'svelte';
	import { Copy, EyeOff, FileSignature, MoreHorizontal, Trash } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { clickOutside, escapeKeydown } from '$lib/actions';
	import { setOutsideClickState } from './context';

	export let property: Property;
	export let isCheckBox: boolean = false;

	let isEditorEnable = false;

	const outsideClickState = setOutsideClickState(true);

	const dispatch = createEventDispatcher<{
		duplicate: string;
		delete: string;
		updPropertyField: { pid: string; name: string; value: boolean | string | PropertyType };
	}>();

	function handleOnInput(e: Event) {
		//TODO: correct item value when property change

		const targetEl = e.target as HTMLInputElement;

		const { name, value } = targetEl;

		dispatch('updPropertyField', { pid: property.id, name, value });
	}

	function enableEditor() {
		isEditorEnable = true;
		tick().then(() => {
			document.getElementById(`${property.id}-name`)?.focus();
		});
	}

	function desableEditor() {
		if ($outsideClickState) isEditorEnable = false;
	}
</script>

<div class="py-0.5 px-1 rounded bg-secondary/40 text-secondary-foreground">
	{#if !isEditorEnable}
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

			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" size="xs">
						<MoreHorizontal class="icon-xs" />
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-56">
					<DropdownMenu.Item on:click={enableEditor} class="space-x-1">
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
									}}
								>
									List view
								</DropdownMenu.CheckboxItem>

								<DropdownMenu.CheckboxItem
									checked={property.isVisibleOnTableView}
									on:click={() => {
										dispatch('updPropertyField', {
											pid: property.id,
											name: 'isVisibleOnTableView',
											value: !property.isVisibleOnTableView
										});
									}}
								>
									Table view
								</DropdownMenu.CheckboxItem>
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>

						<DropdownMenu.Item
							on:click={() => dispatch('duplicate', property.id)}
							class="space-x-1"
						>
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
	{/if}

	{#if isEditorEnable}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:escapeKey={desableEditor}
			on:clickoutside={desableEditor}
			use:clickOutside
			use:escapeKeydown
			class="p-1 space-y-2"
		>
			<div class="flex space-x-1.5">
				<label for={`${property.id}-name`} class="font-semibold"> Name </label>
				<input
					id={`${property.id}-name`}
					value={property.name}
					name="name"
					class="grow input input-ghost px-1 font-semibold text-sm bg-base-200"
					on:input={handleOnInput}
				/>
			</div>

			<div class="flex space-x-1.5">
				<label for={`${property.id}-type`} class="font-semibold space-x-2.5"> Type </label>
				<select
					id={`${property.id}-type`}
					name="type"
					value={property.type}
					class=" grow select select-ghost px-1 font-semibold text-sm bg-base-200"
					on:input={handleOnInput}
				>
					{#each Object.values(PropertyType) as propertyType}
						<option value={propertyType}>
							{capitalizeFirstLetter(propertyType)}
						</option>
					{/each}
				</select>
			</div>

			{#if property.type === 'SELECT'}
				<hr class="border border-secondary" />
				<PropertyOptions
					propertyId={property.id}
					options={property.options}
					on:addOpt
					on:deleteOpt
					on:updOptColor
					on:updOptValue
				/>
			{/if}

			<hr class="border border-secondary" />
			<Button
				variant="secondary"
				size="sm"
				class="h-7 w-full space-x-2"
				on:click={() => dispatch('delete', property.id)}
			>
				<Trash class="icon-xs" />
				<span>Delete property</span>
			</Button>
		</div>
	{/if}
</div>
