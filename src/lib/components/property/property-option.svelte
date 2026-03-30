<script lang="ts">
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import GripHorizontal from 'lucide-svelte/icons/grip-vertical';
	import Trash from 'lucide-svelte/icons/trash';
	import {
		DEBOUNCE_INTERVAL,
		MAX_PROPERTY_OPTION_NAME_LENGTH,
		THEME_COLORS
	} from '$lib/constant/index.js';
	import { Color, type PropertyOption } from '@prisma/client';
	import { capitalizeFirstLetter, tm, useId } from '$lib/utils/index.js';
	import {
		AdaptiveWrapper,
		Badge,
		Button,
		buttonVariants,
		Field,
		HSeparator,
		Label,
		RadioGroup,
		RadioGroupItem,
		Select,
		Tooltip
	} from '$lib/components/base/index.js';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import debounce from 'debounce';
	import { getPropertyState } from './propertyState.svelte';
	import type { UpdOption } from '$lib/types';
	import { tick } from 'svelte';

	type Props = {
		option: PropertyOption;
	};

	let { option }: Props = $props();

	let dragging = $state(false);
	let dragover = $state(false);

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

	function handleKeypress(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		e.stopPropagation();
		if (e.key !== 'Enter') return;
		wrapperState.close();
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

	function ondragover(e: DragEvent) {
		e.preventDefault();
		dragover = true;
	}

	function ondragleave(e: DragEvent) {
		e.preventDefault();
		dragover = false;
	}

	function ondragend() {
		dragging = false;
		dragover = false;
	}

	function ondragstart(e: DragEvent) {
		dragging = true;
		if (!e.dataTransfer) return;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.dropEffect = 'move';
		e.dataTransfer.setData('text/plain', option.order.toString());
	}

	async function ondrop(e: DragEvent) {
		dragover = false;
		dragging = false;
		if (!e.dataTransfer) return;
		e.dataTransfer.dropEffect = 'move';
		const start = +e.dataTransfer.getData('text/plain');
		await propertyState.orderPropertyOption(option.propertyId, start, option.order);
	}

	function setupOptionColorSelectOptions() {
		return Object.keys(THEME_COLORS).map((color) => {
			return {
				id: color,
				label: capitalizeFirstLetter(color),
				isSelected: color === option.color,
				theme: THEME_COLORS[color as Color]
			};
		});
	}

	function getIdPrefix(tail: string) {
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
	<Label for={getIdPrefix('option-name')} name="Name" />
	<input
		id={getIdPrefix('option-name')}
		value={option.value}
		type="text"
		name="name"
		oninput={handleOnInput}
		class="input input-ghost"
		maxlength={MAX_PROPERTY_OPTION_NAME_LENGTH}
	/>
</Field>
<Field>
	<Label for={getIdPrefix('option-color')} name="Color" />
	<Select
		id={getIdPrefix('option-color')}
		options={setupOptionColorSelectOptions()}
		onselect={(opt) => handleSelectColor(opt.id as Color)}
		searchable
	/>
</Field>

<div class="flex items-center justify-end gap-x-2">
	<Button id={`${option.id}-delete-btn`} theme="danger" onclick={() => deleteOption()}>
		<Trash />
		<span>Delete option </span>
	</Button>
</div>
