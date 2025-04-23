<script lang="ts">
	import { getCollectionState } from '$lib/components/collection';
	import { setActiveItemState, setItemState } from '$lib/components/items';
	import { ModalState } from '$lib/states/index.js';
	import { setPropertyState } from '$lib/components/property';
	import { COLLECTION_PAGE_PANEL_CTX_KEY } from '$lib/constant';
	import { setContext } from 'svelte';

	let { children, data } = $props();

	const collectionState = getCollectionState();
	const itemState = setItemState(data.items);
	const propertyState = setPropertyState(findCurrentCollection().properties, data.cid);

	const activeItem = setActiveItemState();
	const panelState = setContext(COLLECTION_PAGE_PANEL_CTX_KEY, new ModalState());

	function findCurrentCollection() {
		return collectionState.collections.find((collection) => collection.id === data.cid)!;
	}

	$effect(() => {
		itemState.items = data.items;
		propertyState.collectionId = data.cid;
		propertyState.properties = findCurrentCollection().properties;
	});

	$effect(() => {
		data.cid;
		activeItem.reset();
		panelState.close();
	});
</script>

{@render children()}
