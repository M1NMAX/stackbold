<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import GripVertical from 'lucide-svelte/icons/grip-vertical';
	import Trash from 'lucide-svelte/icons/trash';
	import Settings from 'lucide-svelte/icons/settings';
	import { capitalizeFirstLetter, tm } from '$lib/utils/index.js';
	import { ViewType, type View } from '@prisma/client';
	import {
		AdaptiveWrapper,
		Button,
		Field,
		HSeparator,
		Label,
		Select
	} from '$lib/components/base/index.js';
	import { getViewState, ViewIcon } from './index.js';
	import debounce from 'debounce';
	import { DEBOUNCE_INTERVAL, MAX_VIEW_NAME_LENGTH } from '$lib/constant/index.js';
	import type { UpdView } from '$lib/types.js';
	import { slide } from 'svelte/transition';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';

	type Props = {
		view: View;
		isOpen: boolean;
		openChange: (value: string | null) => void;
	};

	let { view, isOpen, openChange }: Props = $props();
	let dragging = $state(false);
	let dragover = $state(false);

	const viewState = getViewState();
	const deleteModal = getDeleteModalState();
	const menuState = new ModalState();

	const updViewDebounced = debounce(updView, DEBOUNCE_INTERVAL);
	async function updView(view: UpdView) {
		await viewState.updView(view);
	}

	async function duplicateView() {
		await viewState.duplicateView(view.id);
	}

	async function deleteView() {
		menuState.close();
		deleteModal.open({
			id: view.id,
			type: 'view',
			name: view.name,
			fun: async () => {
				await viewState.deleteView(view.id);
			}
		});
	}

	function handleOnInput(e: Event) {
		const targetEl = e.target as HTMLInputElement;
		updViewDebounced({ id: view.id, name: targetEl.value });
	}

	function getIdPrefix(tail: string) {
		return `${view.id}-${tail}`;
	}

	function setupViewTypeSelectOptions() {
		return Object.values(ViewType).map((viewType) => ({
			id: viewType,
			label: capitalizeFirstLetter(viewType),
			isSelected: viewType === view.type,
			icon: viewType.toLowerCase()
		}));
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
		e.dataTransfer.setData('text/plain', view.order.toString());
	}

	async function ondrop(e: DragEvent) {
		dragover = false;
		dragging = false;
		if (!e.dataTransfer) return;
		e.dataTransfer.dropEffect = 'move';
		const start = +e.dataTransfer.getData('text/plain');
		await viewState.orderView(start, view.order);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex group pr-2 md:pr-4"
	draggable="true"
	{ondragstart}
	{ondrop}
	{ondragend}
	{ondragover}
	{ondragleave}
>
	<GripVertical
		class={tm(
			'size-2 md:size-4 cursor-pointer invisible group-hover:visible',
			'opacity-50 hover:opacity-100 transition-opacity',
			'mt-3.5'
		)}
	/>
	<div
		class={tm(
			'grow border-2',
			isOpen ? 'rounded' : 'rounded-sm',
			dragover ? 'border-secondary/60' : 'border-2 border-secondary',
			dragging && 'select-text outline-0 min-w-0'
		)}
	>
		<div class={tm('flex bg-secondary', dragover && 'bg-opacity-60')}>
			<div class="relative w-full border-r border-card p-0.5">
				<div class="absolute inset-y-0 pl-1 flex items-center pointer-events-none">
					<ViewIcon key={view.type} />
				</div>

				<label for={`${view.id}-name`} class="sr-only"> Name</label>
				<input
					id={`${view.id}-name`}
					value={view.name}
					name="name"
					type="text"
					class="w-full h-8 pl-7 text-sm rounded-md bg-transparent focus:bg-card placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
					oninput={handleOnInput}
					maxlength={MAX_VIEW_NAME_LENGTH}
				/>
			</div>
			<Button
				theme="ghost"
				variant="icon"
				class="hover:bg-card hover:text-card-foreground rounded-3xl"
				onclick={() => openChange(isOpen ? null : view.id)}
			>
				<Settings />
			</Button>
		</div>

		{#if isOpen}
			<div class="flex flex-col gap-y-1 p-2" transition:slide>
				<Field>
					<Label for={getIdPrefix('view-type')} name="Type" />
					<Select
						id={getIdPrefix('view-type')}
						options={setupViewTypeSelectOptions()}
						onselect={(opt) => updView({ id: view.id, type: opt.id as ViewType })}
						searchable
					/>
				</Field>
				<HSeparator />
				<div class="flex justify-end items-center">
					<AdaptiveWrapper bind:open={menuState.isOpen} floatingAlign="end">
						{#snippet trigger()}
							<Ellipsis />
						{/snippet}
						<Button theme="ghost" variant="menu" onclick={() => duplicateView()}>
							<Copy />
							<span> Duplicate view</span>
						</Button>

						<Button theme="danger" variant="menu" onclick={() => deleteView()}>
							<Trash />
							<span> Delete view</span>
						</Button>
					</AdaptiveWrapper>
				</div>
			</div>
		{/if}
	</div>
</div>
