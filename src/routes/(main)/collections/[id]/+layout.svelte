<script lang="ts">
	import { setItemState } from '$lib/components/item/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { setPropertyState } from '$lib/components/property/index.js';
	import { COLLECTION_PAGE_PANEL_CTX_KEY } from '$lib/constant/index.js';
	import { setContext } from 'svelte';
	import { setViewState } from '$lib/components/view/index.js';

	let { children, data } = $props();

	const viewState = setViewState(data.views, data.viewShortId);
	const propertyState = setPropertyState(data.properties);
	const itemState = setItemState(data.items);

	const panelState = setContext(COLLECTION_PAGE_PANEL_CTX_KEY, new ModalState());

	$effect(() => {
		data.cid;

		viewState.views = data.views;
		viewState.collectionId = data.cid;
		viewState.viewShortId = data.viewShortId;
		propertyState.properties = data.properties;
		propertyState.collectionId = data.cid;
		itemState.items = data.items;
		itemState.collectionId = data.cid;
		itemState.viewShortId = data.viewShortId;
		itemState.active = null;

		panelState.close();
	});
</script>

{@render children()}
