<script lang="ts">
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Trash from 'lucide-svelte/icons/trash';
	import { THEME_COLORS } from '$lib/constant';
	import { Color, type Option } from '@prisma/client';
	import { capitalizeFirstLetter, tm, useId } from '$lib/utils/index.js';
	import {
		AdaptiveWrapper,
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
		propertyId: string;
		option: Option;
	};

	let { propertyId, option }: Props = $props();

	let wrapperState = new ModalState();

	let value = $state(option.color as string);

	let selectedKey = $derived.by(() => {
		return (Object.keys(THEME_COLORS).find((key) => key === value) as Color) ?? Color.GRAY;
	});

	const propertyState = getPropertyState();
	const deleteModal = getDeleteModalState();
	const updOptionDebounded = debounce(updOption, 1000);

	async function updOption(pid: string, option: UpdOption) {
		await propertyState.updPropertyOption(pid, option);
	}

	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		updOptionDebounded(propertyId, { id: option.id, value: targetEl.value });
	}

	function handleKeypress(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		e.stopPropagation();
		if (e.key !== 'Enter') return;
		wrapperState.close();
	}

	function handleSelectColor(selectedKey: string) {
		value = selectedKey;
		updOptionDebounded(propertyId, { id: option.id, color: value as Color });
	}

	function deleteOption() {
		wrapperState.close();

		deleteModal.open({
			type: 'option',
			id: propertyId,
			option: option.id,
			name: option.value,
			fun: () => {
				propertyState.removeOptionFromProperty(propertyId, option.id);
			}
		});
	}

	$effect(() => {
		if (wrapperState.isOpen) {
			tick().then(() => {
				document.getElementById(`${propertyId}-option-${option.id}`)?.focus();
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
	{#snippet trigger()}
		<span class={tm('size-4 rounded-md', THEME_COLORS[selectedKey])}></span>
		<span class="grow text-start">{option.value}</span>
		<ChevronRight />
	{/snippet}

	<div class="px-1 pb-1.5 md:px-0 md:pb-1.5">
		<Label for={`${propertyId}-option-${option.id}`} class="md:sr-only font-semibold text-sm">
			{option.value}
		</Label>
		<input
			id={`${propertyId}-option-${option.id}`}
			name="option"
			value={option.value}
			oninput={handleOnInput}
			onkeypress={handleKeypress}
			class="input input-bordered"
		/>
	</div>

	<p class="py-1.5 px-2 text-sm font-semibold">Colors</p>
	<RadioGroup {value} onchange={(value) => handleSelectColor(value)}>
		{#each Object.entries(THEME_COLORS) as [colorName, colorClasses]}
			{@const id = useId(`property-option-color`)}

			<Label for={id} compact hoverEffect>
				<span class={tm('size-4 rounded-md', colorClasses)}></span>
				<span class="grow"> {capitalizeFirstLetter(colorName)}</span>
				<RadioGroupItem {id} value={colorName} />
			</Label>
		{/each}
	</RadioGroup>

	<HSeparator />

	<Button theme="danger" variant="menu" onclick={() => deleteOption()}>
		<Trash />
		<span>Delete option </span>
	</Button>
</AdaptiveWrapper>
