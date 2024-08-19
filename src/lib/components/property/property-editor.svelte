<script context="module" lang="ts">
	import { Calendar, CheckSquare2, Copy, Hash, Link, List, Text, Trash } from 'lucide-svelte';

	// TODO: find better icons
	const icons: { [idx: string]: any } = {
		text: Text,
		select: List,
		checkbox: CheckSquare2,
		date: Calendar,
		number: Hash,
		url: Link
	};

	const aggregatorLabel: { [key: string]: string } = {
		none: 'None',
		count: 'Count all',
		count_empty: 'Count empty',
		count_not_empty: 'Count not empty',
		avg: 'Average',
		sum: 'sum'
	};
</script>

<script lang="ts">
	import { Aggregator, PropertyType, View, type Property } from '@prisma/client';
	import { Button } from '$lib/components/ui/button';
	import { Settings, SquareSlash } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { capitalizeFirstLetter } from '$lib/utils';
	import { containsView, getOption, PropertyOptions, toggleView } from '.';
	import { PROPERTY_COLORS, PROPERTY_DEFAULT_VALUE_NOT_DEFINED } from '$lib/constant';
	import { Separator } from '$lib/components/ui/separator';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';

	export let property: Property;
	export let isOpen: boolean = false;

	const dispatch = createEventDispatcher<{
		openChange: string | null;
		duplicate: string;
		delete: string;
		updPropertyField: {
			pid: string;
			name: keyof Property;
			value: boolean | string | PropertyType | View[];
		};
	}>();

	function handleOnInput(e: Event) {
		// TODO: clean property value, when property type changes

		const targetEl = e.target as HTMLInputElement;
		const name = targetEl.name as keyof Property;
		const value = targetEl.value;

		dispatch('updPropertyField', { pid: property.id, name, value });
	}

	function onClick() {
		dispatch('openChange', isOpen ? null : property.id);
	}
</script>

<div class="p-1 rounded bg-secondary/40 text-secondary-foreground">
	<div class="flex space-x-0.5">
		<div class="relative w-full">
			<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
				<svelte:component this={icons[property.type.toLowerCase()]} class="icon-sm" />
			</div>

			<label for={`${property.id}-name`} class="sr-only"> Name</label>
			<input
				id={`${property.id}-name`}
				value={property.name}
				name="name"
				type="text"
				class="w-full h-9 pl-9 text-sm rounded-sm bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
				on:input={handleOnInput}
			/>
		</div>
		<Button variant="secondary" on:click={onClick}>
			<Settings class="icon-xs" />
		</Button>
	</div>
	{#if isOpen}
		<div class="pt-2 px-1">
			<Select.Root
				portal={null}
				selected={{ value: property.type, label: property.type.toLowerCase() }}
				onSelectedChange={(opt) => {
					dispatch('updPropertyField', {
						pid: property.id,
						name: 'type',
						value: opt ? opt.value : PropertyType.TEXT
					});
				}}
			>
				<Select.Trigger class="w-full bg-secondary focus:ring-0 focus:ring-offset-0 mb-2">
					<p class="text-sm">Type</p>

					<!-- TODO: enhance selected value to include icon, maybe -->
					<Select.Value
						slot="value"
						class="text-sm font-semibold"
						placeholder="Select property type"
					/>
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						{#each Object.values(PropertyType) as propertyType}
							<Select.Item value={propertyType} label={capitalizeFirstLetter(propertyType)}>
								<span class="flex items-center">
									<svelte:component this={icons[propertyType.toLowerCase()]} class="icon-xs mr-2" />
									{capitalizeFirstLetter(propertyType)}
								</span>
							</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>

			<Select.Root
				portal={null}
				selected={{
					value: property.aggregator,
					label: aggregatorLabel[property.aggregator.toLowerCase()]
				}}
				onSelectedChange={(opt) => {
					dispatch('updPropertyField', {
						pid: property.id,
						name: 'aggregator',
						value: opt ? opt.value : Aggregator.NONE
					});
				}}
			>
				<Select.Trigger class="w-full bg-secondary focus:ring-0 focus:ring-offset-0 mb-2">
					<p class="text-sm">Aggregador</p>

					<Select.Value
						slot="value"
						class="text-sm font-semibold"
						placeholder="Select property type"
					/>
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Item value={Aggregator.NONE}>None</Select.Item>
						<Select.Item value={Aggregator.COUNT}>Count all</Select.Item>
						<Select.Item value={Aggregator.COUNT_EMPTY}>Count empty</Select.Item>
						<Select.Item value={Aggregator.COUNT_NOT_EMPTY}>Count not empty</Select.Item>
						{#if property.type === 'NUMBER'}
							<Select.Item value={Aggregator.AVG}>Average</Select.Item>
							<Select.Item value={Aggregator.SUM}>Sum</Select.Item>
						{/if}
					</Select.Group>
				</Select.Content>
			</Select.Root>

			{#if property.type === 'SELECT'}
				{@const selectedOpt = getOption(property.options, property.defaultValue)}
				<Select.Root
					portal={null}
					selected={{
						value: property.defaultValue,
						label: selectedOpt ? selectedOpt.value : PROPERTY_DEFAULT_VALUE_NOT_DEFINED
					}}
					onSelectedChange={(opt) => {
						dispatch('updPropertyField', {
							pid: property.id,
							name: 'defaultValue',
							value: opt ? opt.value : ''
						});
					}}
				>
					<Select.Trigger class="w-full bg-secondary focus:ring-0 focus:ring-offset-0 mb-2">
						<p class="text-sm">Default value</p>

						<Select.Value
							slot="value"
							class="text-sm font-semibold"
							placeholder="Select property type"
						/>
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Item value="">
								<span class="flex items-center">
									<SquareSlash class="icon-sm mr-2 text-primary" />
									{PROPERTY_DEFAULT_VALUE_NOT_DEFINED}
								</span>
							</Select.Item>

							{#each property.options as opt}
								<Select.Item value={opt.value}>
									<span class="flex items-center">
										<span class={` icon-sm mr-2 rounded ${PROPERTY_COLORS[opt.color]}`} />
										{opt.value}
									</span>
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			{/if}

			<Separator />
			<div>
				<p class="text-sm font-semibold">Visibility</p>
				<!-- TODO: maybe use a grid instead of flexbox, future prove maybe -->
				<div class="flex items-center space-x-4 py-2">
					{#each Object.values(View) as view}
						<div class="flex items-center space-x-2">
							<Label for={view}>{capitalizeFirstLetter(view.toString())} view</Label>
							<Switch
								id={view}
								checked={containsView(property.visibleInViews, view)}
								onCheckedChange={() => {
									dispatch('updPropertyField', {
										pid: property.id,
										name: 'visibleInViews',
										value: toggleView(property.visibleInViews, view)
									});
								}}
							/>
						</div>
					{/each}
				</div>
			</div>
			{#if property.type === 'SELECT'}
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
			<div class="flex justify-end items-center space-x-1.5 pt-1">
				<Button variant="ghost" on:click={() => dispatch('duplicate', property.id)}>
					<Copy class="icon-xs" />
					<span> Duplicate</span>
				</Button>

				<Button
					variant="ghost"
					class="hover:text-primary"
					on:click={() => dispatch('delete', property.id)}
				>
					<Trash class="icon-xs" />
					<span> Delete</span>
				</Button>
			</div>
		</div>
	{/if}
</div>
