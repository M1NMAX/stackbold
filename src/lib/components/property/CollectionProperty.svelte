<script lang="ts">
	import { PropertyType, type CollectionProperty } from '@prisma/client';
	import { Checkbox, Input, Select, Textarea, type InputType } from 'flowbite-svelte';
	import Label from './Label.svelte';

	export let property: CollectionProperty;
	export let value: string;

	const propType = property.type.toLowerCase() as InputType;

	const inputClass = '!rounded-sm';
</script>

<div class="flex flex-col space-y-1 rounded bg-gray-200 p-1">
	{#if property.type === PropertyType.CHECKBOX}
		<div class="flex">
			<Checkbox id={property.id} checked={value === 'true'} />

			<Label id={property.id} name={property.name} />
		</div>
	{:else if property.type === PropertyType.SELECT}
		<Label id={property.id} name={property.name} />
		<Select
			id={property.id}
			items={property.options.map(({ value }) => ({ name: value, value }))}
			{value}
			class={inputClass}
		/>
	{:else if property.type === PropertyType.TEXT}
		<Label id={property.id} name={property.name} />
		<Textarea id={property.id} rows="3" name={property.name} {value} class={inputClass} />
	{:else}
		<Label id={property.id} name={property.name} />
		<Input id={property.id} type={propType} {value} class={inputClass} />
	{/if}
</div>
