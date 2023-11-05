<script lang="ts">
	import { TrashBinOutline } from 'flowbite-svelte-icons';
	import { IconBtn, ColorPicker } from '$lib/components';
	import type { Color, Option } from '@prisma/client';

	export let propertyId: string;
	export let option: Option;

	export let onClickDelete: () => void;
	export let onInput: (e: Event) => void;
	export let onClickColor: (pid: string, optionId: string, color: Color) => void;
</script>

<div class="w-full flex justify-between items-center space-x-1">
	<ColorPicker
		value={option.color}
		onChange={(color) => {
			onClickColor(propertyId, option.id, color);
		}}
	/>

	<input
		name="option"
		id={propertyId}
		value={option.value}
		on:input={onInput}
		data-option-id={option.id}
		data-option-field-name="value"
		class="grow input input-xs input-ghost"
	/>

	<IconBtn on:click={onClickDelete}>
		<TrashBinOutline size="xs" />
	</IconBtn>
</div>
