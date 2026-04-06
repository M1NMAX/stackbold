<script lang="ts">
	import Trash from 'lucide-svelte/icons/trash';
	import {
		DEBOUNCE_INTERVAL,
		MAX_PROPERTY_OPTION_NAME_LENGTH,
		THEME_COLORS
	} from '$lib/constant/index.js';
	import { Color, type PropertyOption } from '@prisma/client';
	import { capitalizeFirstLetter } from '$lib/utils/index.js';
	import { Button, Field, Label, Select } from '$lib/components/base/index.js';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import debounce from 'debounce';
	import { getPropertyState } from './propertyState.svelte';
	import type { UpdOption } from '$lib/types';
	import { tick } from 'svelte';

	type Props = {
		option: PropertyOption;
	};

	let { option }: Props = $props();

	const wrapperState = new ModalState();
	const propertyState = getPropertyState();
	const deleteModal = getDeleteModalState();
	const updOptionDebounded = debounce(updOption, DEBOUNCE_INTERVAL);

	async function updOption(pid: string, option: UpdOption) {
		await propertyState.updPropertyOption(pid, option);
	}

	async function handleSelectColor(color: Color) {
		await updOption(option.propertyId, { id: option.id, color });
	}

	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		updOptionDebounded(option.propertyId, { id: option.id, value: targetEl.value });
	}

	function deleteOption() {
		wrapperState.close();

		deleteModal.open({
			type: 'option',
			id: option.propertyId,
			option: option.id,
			name: option.value,
			fun: () => {
				propertyState.removeOptionFromProperty(option.propertyId, option.id);
			}
		});
	}

	function setupOptionColorSelectOptions() {
		return Object.keys(THEME_COLORS).flatMap((color) => {
			if (color === Color.SLATE) return [];
			return [
				{
					id: color,
					label: capitalizeFirstLetter(color),
					isSelected: color === option.color,
					theme: THEME_COLORS[color as Color]
				}
			];
		});
	}

	function getIdWithPrefix(tail: string) {
		return `${option.id}-${tail}`;
	}

	$effect(() => {
		if (wrapperState.isOpen) {
			tick().then(() => {
				document.getElementById(`${option.propertyId}-option-${option.id}`)?.focus();
			});
		}
	});
</script>

<Field>
	<Label for={getIdWithPrefix('option-name')} name="Name" />
	<input
		id={getIdWithPrefix('option-name')}
		value={option.value}
		type="text"
		name="name"
		oninput={handleOnInput}
		class="input input-ghost"
		maxlength={MAX_PROPERTY_OPTION_NAME_LENGTH}
	/>
</Field>
<Field>
	<Label for={getIdWithPrefix('option-color')} name="Color" />
	<Select
		id={getIdWithPrefix('option-color')}
		options={setupOptionColorSelectOptions()}
		onselect={(opt) => handleSelectColor(opt.id as Color)}
		searchable
	/>
</Field>

<div class="flex items-center justify-end gap-x-2">
	<Button theme="danger" onclick={() => deleteOption()}>
		<Trash />
		<span>Delete option </span>
	</Button>
</div>
