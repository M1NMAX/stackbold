<script lang="ts">
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import GripHorizontal from 'lucide-svelte/icons/grip-vertical';
	import Trash from 'lucide-svelte/icons/trash';
	import { DEBOUNCE_INTERVAL, THEME_COLORS } from '$lib/constant/index.js';
	import { Color, type PropertyOption } from '@prisma/client';
	import { capitalizeFirstLetter, tm, useId } from '$lib/utils/index.js';
	import {
		AdaptiveWrapper,
		Badge,
		Button,
		buttonVariants,
		HSeparator,
		Label,
		RadioGroup,
		RadioGroupItem
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

	$effect(() => {
		if (wrapperState.isOpen) {
			tick().then(() => {
				document.getElementById(`${option.propertyId}-option-${option.id}`)?.focus();
			});
		}
	});
</script>

<AdaptiveWrapper
	bind:open={wrapperState.isOpen}
	floatingAlign="end"
	triggerClass={buttonVariants({
		theme: 'ghost',
		variant: 'menu'
	})}
>
	{#snippet customTrigger({ id, toggle })}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			{id}
			{ondragstart}
			{ondrop}
			{ondragend}
			{ondragover}
			{ondragleave}
			draggable="true"
			class="w-full flex justify-between items-center gap-1 cursor-pointer [&_svg]:size-4"
			onclick={() => toggle()}
		>
			<GripHorizontal />
			<span class="grow">
				<Badge color={option.color} class="w-fit">{option.value}</Badge>
			</span>
			<ChevronRight />
		</div>
	{/snippet}

	<div class="px-1 pb-1.5 md:px-0 md:pb-1.5">
		<Label
			for={`${option.propertyId}-option-${option.id}`}
			class="md:sr-only font-semibold text-sm"
		>
			{option.value}
		</Label>
		<input
			id={`${option.propertyId}-option-${option.id}`}
			name="option"
			value={option.value}
			oninput={handleOnInput}
			onkeypress={handleKeypress}
			class="input input-bordered"
		/>
	</div>

	<p class="py-1.5 px-2 text-sm font-semibold">Colors</p>
	<RadioGroup value={option.color} onchange={(value) => handleSelectColor(value as Color)}>
		{#each Object.entries(THEME_COLORS) as [colorName, colorClasses]}
			{#if colorName !== Color.SLATE}
				{@const id = useId(`property-option-color`)}

				<Label for={id} compact hoverEffect>
					<span class={tm('size-4 rounded-md', colorClasses)}></span>
					<span class="grow"> {capitalizeFirstLetter(colorName)}</span>
					<RadioGroupItem {id} value={colorName} />
				</Label>
			{/if}
		{/each}
	</RadioGroup>

	<HSeparator />

	<Button theme="danger" variant="menu" onclick={() => deleteOption()}>
		<Trash />
		<span>Delete option </span>
	</Button>
</AdaptiveWrapper>
