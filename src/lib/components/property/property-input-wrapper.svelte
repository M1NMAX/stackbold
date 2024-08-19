<script lang="ts">
	import { PropertyOptions, containsView, getOption, toggleView } from '.';
	import { Aggregator, PropertyType, View, type Property } from '@prisma/client';
	import { createEventDispatcher, tick } from 'svelte';
	import {
		ChevronRight,
		ChevronRightSquare,
		Copy,
		EyeOff,
		FileSignature,
		MoreHorizontal,
		SquareSlash,
		Trash
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as Popover from '$lib/components/ui/popover';
	import * as Dialog from '$lib/components/ui/dialog';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { clickOutside, escapeKeydown } from '$lib/actions';
	import { getScreenState } from '$lib/components/view';
	import { Separator } from '$lib/components/ui/separator';
	import { PROPERTY_COLORS, PROPERTY_DEFAULT_VALUE_NOT_DEFINED } from '$lib/constant';

	export let property: Property;

	let isEditorOpen = false;

	const isDesktop = getScreenState();

	const dispatch = createEventDispatcher<{
		duplicate: string;
		delete: string;
		updPropertyField: {
			pid: string;
			name: keyof Property;
			value: boolean | string | PropertyType | View[];
		};
	}>();

	function handleOnInput(e: Event) {
		//TODO: correct property value when property type changes
		const targetEl = e.target as HTMLInputElement;
		const name = targetEl.name as keyof Property;
		const value = targetEl.value;
		// const { name, value }: { name: keyof Property , value:string} = targetEl;
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
	<div class="flex justify-between items-center space-x-1">
		{#if property.type === 'CHECKBOX'}
			<slot />
		{/if}
		<label
			for={property.id}
			class="grow flex justify-between items-center py-1 px-0.5 font-semibold text-base select-none"
		>
			{property.name}
		</label>

		{#if $isDesktop}
			<Popover.Root>
				<Popover.Trigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" size="xs">
						<MoreHorizontal class="icon-xs" />
					</Button>
				</Popover.Trigger>
				<Popover.Content>
					{#if isEditorOpen}
						<div
							use:escapeKeydown
							use:clickOutside
							on:escapeKey={closeEditor}
							on:clickoutside={closeEditor}
							class="px-1 space-y-2"
						>
							<label for={`${property.id}-name`} class="sr-only"> Name</label>
							<input
								id={`${property.id}-name`}
								value={property.name}
								name="name"
								class="input input-bordered input-sm col-span-5"
								on:input={handleOnInput}
							/>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild let:builder>
									<Button
										builders={[builder]}
										variant="ghost"
										size="xs"
										class="w-full justify-between"
									>
										<span>Type </span>
										<span class="flex items-center justify-between space-x-1.5">
											{capitalizeFirstLetter(property.type)}
											<ChevronRight class="icon-xs" />
										</span>
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Label>Type</DropdownMenu.Label>
									<DropdownMenu.RadioGroup
										value={property.type}
										onValueChange={(value) => {
											dispatch('updPropertyField', {
												pid: property.id,
												name: 'type',
												value: value ?? PropertyType.TEXT
											});
										}}
									>
										{#each Object.values(PropertyType) as propertyType}
											<DropdownMenu.RadioItem value={propertyType}>
												{capitalizeFirstLetter(propertyType)}
											</DropdownMenu.RadioItem>
										{/each}
									</DropdownMenu.RadioGroup>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild let:builder>
									<Button
										builders={[builder]}
										variant="ghost"
										size="xs"
										class="w-full justify-between"
									>
										<span>Aggregador</span>
										<span class="flex items-center justify-between space-x-1.5">
											{capitalizeFirstLetter(property.aggregator)}
											<ChevronRight class="icon-xs" />
										</span>
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Label>Aggregador</DropdownMenu.Label>
									<DropdownMenu.RadioGroup
										value={property.aggregator}
										onValueChange={(value) => {
											dispatch('updPropertyField', {
												pid: property.id,
												name: 'aggregator',
												value: value ?? Aggregator.NONE
											});
										}}
									>
										<DropdownMenu.RadioItem value={Aggregator.NONE}>None</DropdownMenu.RadioItem>
										<DropdownMenu.RadioItem value={Aggregator.COUNT}>
											Count all
										</DropdownMenu.RadioItem>
										<DropdownMenu.RadioItem value={Aggregator.COUNT_EMPTY}>
											Count empty
										</DropdownMenu.RadioItem>
										<DropdownMenu.RadioItem value={Aggregator.COUNT_NOT_EMPTY}>
											Count not empty
										</DropdownMenu.RadioItem>
										{#if property.type === 'NUMBER'}
											<DropdownMenu.RadioItem value={Aggregator.AVG}>
												Average
											</DropdownMenu.RadioItem>
											<DropdownMenu.RadioItem value={Aggregator.SUM}>Sum</DropdownMenu.RadioItem>
										{/if}
									</DropdownMenu.RadioGroup>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
							{#if property.type === 'SELECT'}
								{@const selectedOpt = getOption(property.options, property.defaultValue)}
								<DropdownMenu.Root>
									<DropdownMenu.Trigger asChild let:builder>
										<Button
											builders={[builder]}
											variant="ghost"
											size="xs"
											class="w-full justify-between"
										>
											<span>Default Value</span>
											<span class="flex items-center justify-between space-x-1.5">
												{#if !selectedOpt}
													{PROPERTY_DEFAULT_VALUE_NOT_DEFINED}
												{:else}
													<span
														class={`h-4 w-4 mr-1 rounded ${PROPERTY_COLORS[selectedOpt.color]}`}
													/>
													{selectedOpt.value}
												{/if}
												<ChevronRight class="icon-xs" />
											</span>
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Label>Default Value</DropdownMenu.Label>
										<DropdownMenu.RadioGroup
											value={property.defaultValue}
											onValueChange={(value) => {
												dispatch('updPropertyField', {
													pid: property.id,
													name: 'defaultValue',
													value: value ?? ''
												});
											}}
										>
											<DropdownMenu.RadioItem value="">
												<SquareSlash class="icon-sm mr-2 text-primary" />
												{PROPERTY_DEFAULT_VALUE_NOT_DEFINED}
											</DropdownMenu.RadioItem>
											{#each property.options as opt}
												<DropdownMenu.RadioItem value={opt.id}>
													<span class={`h-5 w-5 mr-2 rounded ${PROPERTY_COLORS[opt.color]}`} />
													{opt.value}</DropdownMenu.RadioItem
												>
											{/each}
										</DropdownMenu.RadioGroup>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
								<Separator />
								<PropertyOptions
									propertyId={property.id}
									options={property.options}
									on:addOpt
									on:deleteOpt
									on:updOptColor
									on:updOptValue
								/>
							{/if}
							<Separator />

							<div>
								<Button
									on:click={() => dispatch('duplicate', property.id)}
									variant="ghost"
									size="xs"
									class="w-full justify-start"
								>
									<Copy class="icon-xs" />
									<span>Duplicate property</span>
								</Button>
								<Button
									on:click={() => dispatch('delete', property.id)}
									variant="ghost"
									size="xs"
									class="w-full justify-start"
								>
									<Trash class="icon-xs" />
									<span>Delete property</span>
								</Button>
							</div>
						</div>
					{:else}
						<Button on:click={openEditor} variant="ghost" size="xs" class="w-full justify-start">
							<FileSignature class="icon-xs" />
							<span> Edit property </span>
						</Button>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger asChild let:builder>
								<Button builders={[builder]} variant="ghost" size="xs" class="w-full justify-start">
									<EyeOff class="icon-xs" />
									<span> Property visibility</span>
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content sameWidth>
								<DropdownMenu.CheckboxItem
									checked={containsView(property.visibleInViews, View.LIST)}
									on:click={() => {
										dispatch('updPropertyField', {
											pid: property.id,
											name: 'visibleInViews',
											value: toggleView(property.visibleInViews, View.LIST)
										});
									}}
								>
									List view
								</DropdownMenu.CheckboxItem>

								<DropdownMenu.CheckboxItem
									checked={containsView(property.visibleInViews, View.TABLE)}
									on:click={() => {
										dispatch('updPropertyField', {
											pid: property.id,
											name: 'visibleInViews',
											value: toggleView(property.visibleInViews, View.TABLE)
										});
									}}
								>
									Table view
								</DropdownMenu.CheckboxItem>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
						<Button
							on:click={() => dispatch('duplicate', property.id)}
							variant="ghost"
							size="xs"
							class="w-full justify-start"
						>
							<Copy class="icon-xs" />
							<span>Duplicate property</span>
						</Button>

						<Separator />
						<Button
							on:click={() => dispatch('delete', property.id)}
							variant="ghost"
							size="xs"
							class="w-full justify-start"
						>
							<Trash class="icon-xs" />
							<span>Delete property</span>
						</Button>
					{/if}
				</Popover.Content>
			</Popover.Root>
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
						<Dialog.Root>
							<Dialog.Trigger asChild let:builder>
								<Button builders={[builder]} variant="secondary" on:click={openEditor}>
									<FileSignature class="icon-xs" />
									<span> Edit property </span>
								</Button>
							</Dialog.Trigger>
							<Dialog.Content class="sm:max-w-[425px]">
								<Dialog.Header>
									<Dialog.Title>Edit property</Dialog.Title>
								</Dialog.Header>
								<div class="space-y-2">
									<label for={`${property.id}-name`} class="sr-only"> Name </label>
									<input
										id={`${property.id}-name`}
										value={property.name}
										name="name"
										class="input input-sm"
										on:input={handleOnInput}
									/>

									<div class="flex space-x-1.5">
										<label for={`${property.id}-type`} class="font-semibold space-x-2.5">
											Type
										</label>
										<select
											id={`${property.id}-type`}
											name="type"
											value={property.type}
											class="select select-sm"
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
								</div>
							</Dialog.Content>
						</Dialog.Root>

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

	{#if property.type !== 'CHECKBOX'}
		<slot />
	{/if}
</div>
