<script lang="ts">
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import { Button } from '$lib/components/base/index.js';
	import { ModalState } from '$lib/states/index.js';
	import { useId } from '$lib/utils/index.js';
	import { clickOutside, escapeKeydown } from '$lib/actions/index.js';
	import { onMount, tick } from 'svelte';

	type Props = {
		value?: string;
		placeholder?: string;
	};

	let { value = $bindable(), placeholder = 'Search' }: Props = $props();

	const id = useId();
	const expandState = new ModalState();

	function handleClose() {
		if (value) return;
		expandState.close();
	}

	onMount(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (e.shiftKey && e.key === '/') {
				e.preventDefault();
				expandState.open();
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	$effect(() => {
		if (!expandState.isOpen) return;
		const inputEl = document.getElementById(id) as HTMLInputElement;
		tick().then(() => inputEl.focus());
	});
</script>

{#if !expandState.isOpen}
	<Button theme="ghost" variant="icon" onclick={() => expandState.open()}><Search /></Button>
{:else}
	<div
		use:clickOutside
		use:escapeKeydown
		onclickoutside={handleClose}
		onescapekey={handleClose}
		class="relative w-full"
	>
		<div class="input-left-icon">
			<Search />
		</div>
		<input
			{id}
			{placeholder}
			bind:value
			class="input secondary icon-left icon-right !h-9 lg:!h-9"
		/>

		{#if value && value.length > 0}
			<Button
				type="button"
				theme="ghost"
				variant="icon"
				class="absolute inset-y-0 right-0"
				onclick={() => (value = '')}
			>
				<X />
			</Button>
		{/if}
	</div>
{/if}
