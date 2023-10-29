<script lang="ts">
	import { PropertyType, type CollectionProperty } from '@prisma/client';
	import Label from './Label.svelte';
	import Textarea from '../Textarea/Textarea.svelte';

	export let property: CollectionProperty;
	export let value: string;
</script>

{#if property.type === PropertyType.CHECKBOX}
	<div class="form-control flex flex-row items-center space-x-2 rounded bg-gray-200 px-2">
		<input
			id={property.id}
			type="checkbox"
			checked={value === 'true'}
			class="checkbox checkbox-sm checkbox-primary"
		/>
		<Label id={property.id} name={property.name} on:edit on:duplicate on:delete />
	</div>
{:else}
	<div class="form-control rounded bg-gray-200 px-2 pb-2 pt-0">
		<Label id={property.id} name={property.name} on:edit on:duplicate on:delete />

		{#if property.type === PropertyType.SELECT}
			<select {value} class="select select-sm select-ghost bg-gray-200">
				{#each property.options as option}
					<option value={option.value}>
						{option.value}
					</option>
				{/each}
			</select>
		{:else if property.type === PropertyType.TEXT}
			<Textarea
				id={property.id}
				name={property.name}
				{value}
				placeholder="Empty"
				class="textarea textarea-sm textarea-ghost font-medium bg-gray-200"
			/>
		{:else}
			<input
				id={property.id}
				type={property.type.toLowerCase()}
				{value}
				class="input input-sm input-ghost font-medium bg-gray-200"
			/>
		{/if}
	</div>
{/if}
