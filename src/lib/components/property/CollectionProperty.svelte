<script lang="ts">
	import { PropertyType, type CollectionProperty } from '@prisma/client';
	import Label from './Label.svelte';
	import Textarea from '../Textarea/Textarea.svelte';
	import { createEventDispatcher } from 'svelte';

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

{#if property.type === PropertyType.CHECKBOX}
	<div class="form-control flex flex-row items-center space-x-2 rounded bg-gray-100 px-2">
		<input
			id={property.id}
			type="checkbox"
			checked={value === 'true'}
			on:input={handleOnInput}
			class="checkbox"
		/>
		<Label id={property.id} name={property.name} on:edit on:duplicate on:delete />
	</div>
{:else}
	<div class="form-control rounded bg-gray-100 px-1 pb-1">
		<Label id={property.id} name={property.name} on:edit on:duplicate on:delete />

		{#if property.type === PropertyType.SELECT}
			<select {value} on:input={handleOnInput} class="w-full h-7 select select-ghost bg-gray-200">
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
				class="w-full h-7 p-1 textarea textarea-ghost font-medium bg-gray-200"
			/>
		{:else}
			<input
				id={property.id}
				type={property.type.toLowerCase()}
				{value}
				on:input={handleOnInput}
				class="w-full h-7 p-1 input input-ghost font-medium bg-gray-200"
			/>
		{/if}
	</div>
{/if}
