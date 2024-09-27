<script lang="ts">
	import { getCollectionState } from '$lib/components/collection';
	import { setItemState } from '$lib/components/items';
	import { ModalState } from '$lib/components/modal';
	import { setPropertyState } from '$lib/components/property';
	import { ITEM_PANEL_CTX_KEY, PROPERTIES_PANEL_CTX_KEY } from '$lib/constant';
	import { setContext } from 'svelte';

	let { children, data } = $props();

	const collectionState = getCollectionState();

	const itemState = setItemState(data.items);

	const propertyState = setPropertyState(findCurrentCollection().properties, data.cid);

	function findCurrentCollection() {
		return collectionState.collections.find((collection) => collection.id === data.cid)!;
	}

	$effect(() => {
		itemState.items = data.items;
		propertyState.collectionId = data.cid;
		propertyState.properties = findCurrentCollection().properties;
	});

	setContext(PROPERTIES_PANEL_CTX_KEY, new ModalState());
	setContext(ITEM_PANEL_CTX_KEY, new ModalState());
</script>

{@render children()}
