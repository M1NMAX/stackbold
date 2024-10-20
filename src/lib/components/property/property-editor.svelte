<script module lang="ts">
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
	import { Copy, Trash, Settings, SquareSlash } from 'lucide-svelte';
	import { capitalizeFirstLetter } from '$lib/utils';
	import {
		// utils
		containsView,
		getOption,
		toggleView,
		// components
		PropertyOptions,
		PropertyIcon,
		getPropertyState
	} from '.';
	import {
		DEBOUNCE_INTERVAL,
		PROPERTY_COLORS,
		PROPERTY_DEFAULT_VALUE_NOT_DEFINED
	} from '$lib/constant';
	import { Separator } from '$lib/components/ui/separator';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { getDeleteModalState } from '../modal';
	import type { UpdProperty } from '$lib/types';
	import debounce from 'debounce';
	import { getItemState } from '$lib/components/items';

	type Props = {
		property: Property;
		isOpen: boolean;
		openChange: (value: string | null) => void;
	};

	let { property, isOpen = false, openChange }: Props = $props();

	const deleteModal = getDeleteModalState();
	const propertyState = getPropertyState();
	const itemState = getItemState();

	async function duplicateProperty() {
		await propertyState.duplicateProperty(property.id);
		const prop = propertyState.getMostRecentProperty(propertyState.properties);
		await itemState.addPropertyRef(prop.id);
	}

	const updPropertyDebounced = debounce(updProperty, DEBOUNCE_INTERVAL);
	async function updProperty(property: UpdProperty) {
		await propertyState.updProperty(property);
	}

	function handleOnInput(e: Event) {
		// TODO: clean property value, when property type changes
		const targetEl = e.target as HTMLInputElement;
		updPropertyDebounced({ id: property.id, name: targetEl.value });
	}

	function deleteProperty() {
		deleteModal.open({
			id: property.id,
			type: 'property',
			name: property.name,
			fun: () => {
				propertyState.deleteProperty(property.id);
			}
		});
	}
</script>

<div class="p-1 rounded bg-secondary/40 text-secondary-foreground">
	<div class="flex space-x-0.5">
		<div class="relative w-full">
			<div class="absolute inset-y-0 pl-3 flex items-center pointer-events-none">
				<PropertyIcon key={property.type} />
			</div>

			<label for={`${property.id}-name`} class="sr-only"> Name</label>
			<input
				id={`${property.id}-name`}
				value={property.name}
				name="name"
				type="text"
				class="w-full h-9 pl-9 text-sm rounded-sm bg-secondary/40 placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
				oninput={handleOnInput}
			/>
		</div>
		<Button variant="secondary" on:click={() => openChange(isOpen ? null : property.id)}>
			<Settings class="icon-xs" />
		</Button>
	</div>
	{#if isOpen}
		<div class="pt-2 px-1">
			<Select.Root
				portal={null}
				selected={{ value: property.type, label: property.type.toLowerCase() }}
				onSelectedChange={(opt) => {
					const type = opt ? opt.value : PropertyType.TEXT;
					updProperty({ id: property.id, type: type });
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
									<PropertyIcon key={propertyType} />
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
					label: capitalizeFirstLetter(aggregatorLabel[property.aggregator.toLowerCase()])
				}}
				onSelectedChange={(opt) => {
					const aggregator = opt ? opt.value : Aggregator.NONE;
					updProperty({ id: property.id, aggregator });
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
						const value = opt ? opt.value : '';
						updProperty({ id: property.id, defaultValue: value });
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
								<Select.Item value={opt.id}>
									<span class="flex items-center">
										<span class={` icon-sm mr-2 rounded ${PROPERTY_COLORS[opt.color]}`}></span>
										{opt.value}
									</span>
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			{/if}

			<!-- TODO: maybe use a grid instead of flexbox, future prove maybe -->
			<div class="p-2">
				<p class="text-sm">Visibility</p>
				<div class="space-y-1">
					{#each Object.values(View) as view}
						<div class="flex justify-between items-center">
							<Label for={view} class="text-sm font-semibold">
								Visible in {capitalizeFirstLetter(view.toString())} view
							</Label>
							<Switch
								id={view}
								checked={containsView(property.visibleInViews, view)}
								onCheckedChange={() => {
									updProperty({
										id: property.id,
										visibleInViews: toggleView(property.visibleInViews, view)
									});
								}}
							/>
						</div>
					{/each}
				</div>
			</div>
			{#if property.type === 'SELECT'}
				<Separator />
				<PropertyOptions propertyId={property.id} options={property.options} />
			{/if}

			<Separator />
			<div class="flex justify-end items-center space-x-1.5 pt-1">
				<Button variant="ghost" on:click={() => duplicateProperty()}>
					<Copy class="icon-xs" />
					<span> Duplicate</span>
				</Button>

				<Button variant="ghost" class="hover:text-primary" on:click={() => deleteProperty()}>
					<Trash class="icon-xs" />
					<span> Delete</span>
				</Button>
			</div>
		</div>
	{/if}
</div>
