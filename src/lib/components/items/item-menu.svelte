<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import PanelLeftOpen from 'lucide-svelte/icons/panel-left-open';
	import Trash from 'lucide-svelte/icons/trash';
	import { getDeleteModalState, ModalState } from '$lib/states/index.js';
	import { getItemState } from '.';
	import { Button, buttonVariants, HSeparator, Menu } from '$lib/components/base/index.js';
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
		await itemState.duplicateItem(id);
	}

	function openItem() {
		menuState.close();
		clickOpenItem(id);
	}
</script>

<Menu
	bind:open={menuState.isOpen}
	{align}
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
		<span> Open </span>
	</Button>

	<Button theme="ghost" variant="menu" onclick={() => duplicateItem()}>
		<Copy />
		<span>Duplicate</span>
	</Button>

	<HSeparator />

	<Button theme="danger" variant="menu" onclick={() => deleteItem()}>
		<Trash />
		<span>Delete</span>
	</Button>
</Menu>
