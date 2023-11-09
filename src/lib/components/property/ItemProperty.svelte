<script lang="ts">
	import { PROPERTY_COLORS } from '$lib/constant';
	import { createEventDispatcher } from 'svelte';
	import type { CollectionProperty, Color } from '@prisma/client';

	export let itemId: string;
	export let property: CollectionProperty;
	export let color: Color = 'GRAY';
	export let value: string | null;

	const dispatch = createEventDispatcher<{
		updPropertyValue: { itemId: string; property: { id: string; value: string } };
	}>();

	const handleOnInput = (e: Event) => {
		const input = e.target as HTMLInputElement;

		const currValue = input.type === 'checkbox' ? input.checked.toString() : input.value;

		dispatch('updPropertyValue', { itemId, property: { id: property.id, value: currValue } });
	};
</script>

{#if value}
	{#if property.type === 'CHECKBOX'}
		<label
			class={` ${PROPERTY_COLORS[color]} label rounded inline-flex items-center justify-center space-x-1 text-sm   font-semibold px-1 py-0.5  `}
		>
			<input
				type="checkbox"
				checked={value === 'true'}
				on:input={handleOnInput}
				class="checkbox checkbox-xs checkbox-primary"
			/>
			<span class="label-text font-semibold">{property.name} </span>
		</label>
	{:else}
		<div
			class={` ${PROPERTY_COLORS[color]} rounded inline-flex items-center justify-center space-x-1 text-sm font-semibold px-1 py-0.5 `}
		>
			{value}
		</div>
	{/if}
{/if}
