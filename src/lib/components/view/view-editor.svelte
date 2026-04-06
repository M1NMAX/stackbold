<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Trash from 'lucide-svelte/icons/trash';
	import { capitalizeFirstLetter } from '$lib/utils/index.js';
	import { ViewType, type View } from '@prisma/client';
	import { Button, Field, HSeparator, Label, Select } from '$lib/components/base/index.js';
	import { getViewState } from './index.js';
	import debounce from 'debounce';
	import { DEBOUNCE_INTERVAL, MAX_VIEW_NAME_LENGTH } from '$lib/constant/index.js';
	import type { UpdView } from '$lib/types.js';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';

	type Props = {
		view: View;
	};

	let { view }: Props = $props();

	const viewState = getViewState();
	const deleteModal = getDeleteModalState();

	const updViewDebounced = debounce(updView, DEBOUNCE_INTERVAL);
	async function updView(view: UpdView) {
		await viewState.updView(view);
	}

	async function duplicateView() {
		await viewState.duplicateView(view.id);
	}

	async function deleteView() {
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
</script>

<Field>
	<Label for={getIdPrefix('view-name')} name="Name" />
	<input
		id={getIdPrefix('view-name')}
		value={view.name}
		type="text"
		name="name"
		oninput={handleOnInput}
		class="input input-ghost"
		maxlength={MAX_VIEW_NAME_LENGTH}
	/>
</Field>
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
	<Button theme="ghost" onclick={() => duplicateView()}>
		<Copy />
		<span> Duplicate </span>
	</Button>

	<Button theme="danger" onclick={() => deleteView()}>
		<Trash />
		<span> Delete </span>
	</Button>
</div>
