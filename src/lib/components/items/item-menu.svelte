<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import PanelLeftOpen from 'lucide-svelte/icons/panel-left-open';
	import Trash from 'lucide-svelte/icons/trash';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import { getItemState } from './index.js';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		HSeparator
	} from '$lib/components/base/index.js';
	import type { Align } from '$lib/types';

	type Props = {
		id: string;
		name: string;
		align: Align;
		clickOpenItem: (id: string) => void;
	};

	let { id, name, align, clickOpenItem }: Props = $props();
	const menuState = new ModalState();

	const itemState = getItemState();
	const deleteModal = getDeleteModalState();

	function deleteItem() {
		menuState.close();
		deleteModal.open({
			type: 'item',
			id,
			name,
			fun: async () => {
				await itemState.deleteItem(id);
			}
		});
	}

	async function duplicateItem() {
		menuState.close();
		await itemState.duplicateItem(id, true);
	}

	function openItem() {
		menuState.close();
		clickOpenItem(id);
	}
</script>

<AdaptiveWrapper
	bind:open={menuState.isOpen}
	floatingAlign={align}
	triggerClass={buttonVariants({
		theme: 'ghost',
		variant: 'compact',
		class: [menuState.isOpen && 'visible bg-accent']
	})}
>
	{#snippet trigger()}
		<Ellipsis />
	{/snippet}

	<Button theme="ghost" variant="menu" onclick={() => openItem()}>
		<PanelLeftOpen />
		<span> Open item </span>
	</Button>

	<Button theme="ghost" variant="menu" onclick={() => duplicateItem()}>
		<Copy />
		<span>Duplicate item</span>
	</Button>

	<HSeparator />

	<Button theme="danger" variant="menu" onclick={() => deleteItem()}>
		<Trash />
		<span>Delete item</span>
	</Button>
</AdaptiveWrapper>
