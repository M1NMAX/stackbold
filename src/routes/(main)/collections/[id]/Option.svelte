<script lang="ts">
	import { IconBtn } from '$lib/components';
	import { BarsOutline, TrashBinOutline } from 'flowbite-svelte-icons';

	export let propertyId: string;
	export let optionId: string | undefined;
	export let value: string | undefined;

	export let onClickDelete: () => void;
	export let onInput: (e: Event) => void;
</script>

<div class="w-full flex justify-between items-center space-x-1">
	<IconBtn>
		<BarsOutline size="xs" />
	</IconBtn>

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
