<script lang="ts">
	import { PropertyOptions } from '.';
	import { PropertyType, type Property } from '@prisma/client';
	import { createEventDispatcher, tick } from 'svelte';
	import {
		ChevronRightSquare,
		Copy,
		EyeOff,
		FileSignature,
		MoreHorizontal,
		Trash
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { escapeKeydown } from '$lib/actions';

	import { getScreenState } from '$lib/components/view';

	export let property: Property;
	export let isCheckBox: boolean = false;

	let isEditorOpen = false;

	const isDesktop = getScreenState();

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

	function openEditor() {
		isEditorOpen = true;
		tick().then(() => {
			document.getElementById(`${property.id}-name`)?.focus();
		});
	}

	function closeEditor() {
		isEditorOpen = false;
	}
</script>

<div class="py-0.5 px-1 rounded bg-secondary/40 text-secondary-foreground">
	{#if !isEditorOpen}
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

			{#if $isDesktop}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button builders={[builder]} variant="ghost" size="xs">
							<MoreHorizontal class="icon-xs" />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56">
						<DropdownMenu.Item on:click={openEditor} class="space-x-1">
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
			{:else}
				<Drawer.Root>
					<Drawer.Trigger asChild let:builder>
						<Button builders={[builder]} variant="ghost" size="xs">
							<MoreHorizontal class="icon-xs" />
						</Button>
					</Drawer.Trigger>
					<Drawer.Content>
						<Drawer.Header class="py-2">
							<div class="flex items-center space-x-2">
								<div class="p-2.5 rounded bg-secondary">
									<ChevronRightSquare class="icon-sm" />
								</div>

								<div class="flex flex-col items-start justify-start">
									<div class=" text-base font-semibold truncate">{property.name}</div>
									<div class="text-sm">
										{capitalizeFirstLetter(property.type)}
									</div>
								</div>
							</div>
						</Drawer.Header>

						<Drawer.Footer class="pt-2">
							<Button variant="secondary" on:click={openEditor}>
								<FileSignature class="icon-xs" />
								<span> Edit property </span>
							</Button>

							<Button variant="secondary" on:click={() => dispatch('duplicate', property.id)}>
								<Copy class="icon-xs" />
								<span>Duplicate property</span>
							</Button>
							<Button variant="destructive" on:click={() => dispatch('delete', property.id)}>
								<Trash class="icon-xs" />
								<span>Delete property</span>
							</Button>
						</Drawer.Footer>
					</Drawer.Content>
				</Drawer.Root>
			{/if}
		</div>

		{#if !isCheckBox}
			<slot />
		{/if}
	{/if}

	<!-- TODO: ref editor hide/show logic -->

	{#if isEditorOpen}
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<div
			on:escapeKey={closeEditor}
			use:escapeKeydown
			class="p-1 space-y-2 rounded border border-primary/50"
		>
			<div class="flex justify-between items-center space-x-2 pb-2">
				<div class="flex items-center space-x-2">
					<div class="p-2.5 rounded bg-secondary">
						<FileSignature class="icon-xs" />
					</div>

					<span> Edit property </span>
				</div>

				<Button variant="secondary" on:click={closeEditor}>
					{$isDesktop ? 'Esc' : 'Done'}
				</Button>
			</div>
			<div class="flex space-x-1.5">
				<label for={`${property.id}-name`} class="font-semibold"> Name </label>
				<input
					id={`${property.id}-name`}
					value={property.name}
					name="name"
					class="input"
					on:input={handleOnInput}
				/>
			</div>

			<div class="flex space-x-1.5">
				<label for={`${property.id}-type`} class="font-semibold space-x-2.5"> Type </label>
				<select
					id={`${property.id}-type`}
					name="type"
					value={property.type}
					class="select"
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
				class="h-8 w-full hover:text-primary"
				on:click={() => dispatch('delete', property.id)}
			>
				<Trash class="icon-xs" />
				<span>Delete property</span>
			</Button>
		</div>
	{/if}
</div>
