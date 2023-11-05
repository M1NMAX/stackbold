<script lang="ts">
	import { TrashBinOutline } from 'flowbite-svelte-icons';
	import { IconBtn, ColorPicker } from '$lib/components';
	import type { Color } from '@prisma/client';

	export let propertyId: string;
	export let optionId: string | undefined;
	export let value: string | undefined;
	export let color: Color | undefined;

	export let onClickDelete: () => void;
	export let onInput: (e: Event) => void;
	export let onClickColor: (pid: string, optionId: string | undefined, color: Color) => void;
</script>

<div class="w-full flex justify-between items-center space-x-1">
	<ColorPicker
		value={color}
		onChange={(color) => {
			onClickColor(propertyId, optionId, color);
		}}
	/>

	<input
		name="option"
		id={propertyId}
		{value}
		on:input={onInput}
		data-option-id={optionId}
		data-option-field-name="value"
		class="grow input input-xs input-ghost"
	/>

	<IconBtn on:click={onClickDelete}>
		<TrashBinOutline size="xs" />
	</IconBtn>
</div>
