<script lang="ts">
	import { setActiveItemState, setItemState } from '$lib/components/items';
	import { ModalState } from '$lib/states/index.js';
	import { setPropertyState } from '$lib/components/property';
	import { COLLECTION_PAGE_PANEL_CTX_KEY } from '$lib/constant';
	import { setContext } from 'svelte';

	let { children, data } = $props();

	const itemState = setItemState(data.items);
	const propertyState = setPropertyState(data.properties);

	const activeItem = setActiveItemState();
	const panelState = setContext(COLLECTION_PAGE_PANEL_CTX_KEY, new ModalState());

	$effect(() => {
		itemState.items = data.items;
		propertyState.properties = data.properties;
		propertyState.collectionId = data.cid;
	});

	$effect(() => {
		data.cid;
		activeItem.reset();
		panelState.close();
	});
</script>

{@render children()}
