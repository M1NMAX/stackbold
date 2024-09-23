<script lang="ts">
	import { ModalState } from '$lib/components/modal';
	import { AddPropertyPopover, getPropertyState, PropertyEditor } from '$lib/components/property';
	import { Button } from '$lib/components/ui/button';
	import { PROPERTIES_PANEL_CTX_KEY } from '$lib/constant';
	import { X } from 'lucide-svelte';
	import { getContext } from 'svelte';

	let currentlyOpen = $state<string | null>(null);
	const propertyState = getPropertyState();

	const propertiesPanel = getContext<ModalState>(PROPERTIES_PANEL_CTX_KEY);

	function toggleEditor(pid: string | null) {
		currentlyOpen = pid;
	}

	function onClickCloseBtn() {
		history.back();
		propertiesPanel.closeModal();
	}
</script>

<div class="flex items-center justify-between">
	<h2 class="text-2xl font-semibold text-center">Properties</h2>
	<Button variant="secondary" size="icon" on:click={() => onClickCloseBtn()}>
		<X class="icon-sm" />
	</Button>
</div>
<div class="grow flex flex-col space-y-2 overflow-y-auto">
	{#each propertyState.properties as property}
		<PropertyEditor
			{property}
			isOpen={currentlyOpen === property.id}
			openChange={(value) => toggleEditor(value)}
		/>
	{/each}
</div>
<div>
	<AddPropertyPopover />
</div>
