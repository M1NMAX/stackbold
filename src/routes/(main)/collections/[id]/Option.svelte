<script lang="ts">
	import { TrashBinOutline } from 'flowbite-svelte-icons';
	import { IconBtn, ColorPicker } from '$lib/components';
	import { createEventDispatcher } from 'svelte';
	import type { Color, Option } from '@prisma/client';

	export let propertyId: string;
	export let option: Option;

	const dispatch = createEventDispatcher<{
		updOptColor: { propertyId: string; optionId: string; color: Color };
		updOptValue: { propertyId: string; optionId: string; value: string };
		deleteOpt: { propertyId: string; optionId: string };
	}>();

	const handleOnInput = (e: Event) => {
		const targetEl = e.target as HTMLInputElement;
		dispatch('updOptValue', { propertyId, optionId: option.id, value: targetEl.value });
	};
</script>

<div class="w-full flex justify-between items-center space-x-1">
	<ColorPicker
		value={option.color}
		onChange={(color) => dispatch('updOptColor', { propertyId, optionId: option.id, color })}
	/>

	<input
		name="option"
		value={option.value}
		on:input={handleOnInput}
		class="grow input input-xs input-ghost"
	/>

	<IconBtn on:click={() => dispatch('deleteOpt', { propertyId, optionId: option.id })}>
		<TrashBinOutline size="xs" />
	</IconBtn>
</div>
