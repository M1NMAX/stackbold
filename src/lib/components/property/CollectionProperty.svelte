<script lang="ts">
	import { PropertyType, type CollectionProperty } from '@prisma/client';
	import Label from './Label.svelte';
	import type { InputType } from 'flowbite-svelte';

	export let property: CollectionProperty;
	export let value: string;

	const propType = property.type.toLowerCase() as InputType;

	const inputClass = 'rounded-sm bg-gray-200 border-none text-base font-semibold py-0 px-1';
</script>

{#if property.type === PropertyType.CHECKBOX}
	<div class="form-control flex flex-row items-center space-x-2 rounded bg-gray-200 px-2">
		<input
			id={property.id}
			type="checkbox"
			checked={value === 'true'}
			class="checkbox rounded border checkbox-primary text-3xl focus:ring-0"
		/>
		<Label id={property.id} name={property.name} />
	</div>
{:else}
	<div class="form-control rounded bg-gray-200 px-2 pb-2 pt-0">
		{#if property.type === PropertyType.SELECT}
			<Label id={property.id} name={property.name} />

			<select {value} class={` select select-ghost ${inputClass}`}>
				{#each property.options as option}
					<option value={option.value}>
						{option.value}
					</option>
				{/each}
			</select>
		{:else if property.type === PropertyType.TEXT}
			<Label id={property.id} name={property.name} />

			<textarea
				id={property.id}
				name={property.name}
				{value}
				rows="3"
				class={` textarea textarea-ghost ${inputClass}`}
			/>
		{:else}
			<Label id={property.id} name={property.name} />
			<input id={property.id} type={propType} {value} class={`input input-ghost ${inputClass}`} />
		{/if}
	</div>
{/if}
