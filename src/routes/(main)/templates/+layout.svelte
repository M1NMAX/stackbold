<script lang="ts">
	import { ModalState } from '$lib/states/index.js';
	import { TEMPLATE_PANEL_CTX_KEY } from '$lib/constant';
	import { setContext } from 'svelte';

	let { children } = $props();

	setContext(TEMPLATE_PANEL_CTX_KEY, new ModalState());
</script>

{@render children()}
