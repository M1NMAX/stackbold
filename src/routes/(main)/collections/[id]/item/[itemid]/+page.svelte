<script lang="ts">
	import { getItemState } from '$lib/components/items';
	import { ModalState } from '$lib/components/modal';
	import { getPropertyState, PropertyInput, PropertyInputWrapper } from '$lib/components/property';
	import { Button } from '$lib/components/ui/button';
	import { ITEM_PANEL_CTX_KEY } from '$lib/constant';
	import { X } from 'lucide-svelte';
	import { getContext } from 'svelte';

	let { data } = $props();

	const propertyState = getPropertyState();
	const itemState = getItemState();
	let item = $derived(getCurrentItem());

	// Utils functions
	function getCurrentItem() {
		return itemState.items.find((item) => item.id === data.id)!;
	}

	const itemPanel = getContext<ModalState>(ITEM_PANEL_CTX_KEY);
	function onClickCloseBtn() {
		history.back();
		itemPanel.closeModal();
	}
</script>

<div class="flex items-center justify-between">
	<!-- TODO: add handler for onInput ev -->
	<h2 class="text-2xl font-semibold text-center">{item.name}</h2>
	<Button variant="secondary" size="icon" on:click={() => onClickCloseBtn()}>
		<X class="icon-sm" />
	</Button>
</div>
<div class="space-y-2">
	{#each propertyState.properties as property}
		<PropertyInputWrapper {property}>
			<PropertyInput {property} itemId={item.id} />
		</PropertyInputWrapper>
	{/each}
</div>
