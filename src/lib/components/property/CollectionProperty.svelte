<script lang="ts">
	import { PropertyType, type CollectionProperty } from '@prisma/client';
	import Textarea from '../Textarea/Textarea.svelte';
	import { createEventDispatcher } from 'svelte';
	import PropertyWrapper from './PropertyWrapper.svelte';

	export let property: CollectionProperty;
	export let value: string;

	const dispatch = createEventDispatcher<{
		updPropertyValue: { pid: string; value: string };
	}>();

	const handleOnInput = (e: Event) => {
		const input = e.target as HTMLInputElement;

		const currValue = input.type === 'checkbox' ? input.checked.toString() : input.value;

		dispatch('updPropertyValue', { pid: property.id, value: currValue });
	};
</script>

<PropertyWrapper
	{property}
	isCheckBox={property.type === PropertyType.CHECKBOX}
	on:duplicate
	on:delete
	on:updPropertyField
	on:addOpt
	on:deleteOpt
	on:updOptColor
	on:updOptValue
>
	{#if property.type === PropertyType.CHECKBOX}
		<input
			id={property.id}
			type="checkbox"
			checked={value === 'true'}
			on:input={handleOnInput}
			class="checkbox"
		/>
	{:else if property.type === PropertyType.SELECT}
		<select {value} on:input={handleOnInput} class="w-full h-8 select select-ghost">
			{#each property.options as option}
				<option value={option.id}>
					{option.value}
				</option>
			{/each}
		</select>
	{:else if property.type === PropertyType.TEXT}
		<Textarea
			id={property.id}
			name={property.name}
			{value}
			on:input={handleOnInput}
			placeholder="Empty"
			class="w-full h-8 textarea textarea-ghost font-medium"
		/>
	{:else}
		<input
			id={property.id}
			type={property.type.toLowerCase()}
			{value}
			on:input={handleOnInput}
			class="w-full h-8 input input-ghost font-medium"
		/>
	{/if}
</PropertyWrapper>
