<script lang="ts">
	import Search from 'lucide-svelte/icons/search';
	import X from 'lucide-svelte/icons/x';
	import { tick, type Snippet } from 'svelte';
	import { setCommandState } from '$lib/states/index.js';
	import { Dialog } from './index.js';
	import { useId } from '$lib/utils';

	type Props = {
		open: boolean;
		children: Snippet;
		placeholder?: string;
	};

	let { open = $bindable(), children, placeholder = 'Search for something...' }: Props = $props();
	let commandRef = $state<HTMLDivElement | null>(null);
	const id = useId();

	const commandState = setCommandState();

	function close() {
		open = false;
	}

	$effect(() => {
		if (!commandRef) return;
		commandState.setRef(commandRef);
	});

	$effect(() => {
		if (open) {
			const inputEl = document.getElementById(id) as HTMLInputElement;
			tick().then(() => inputEl.focus());
		}
	});
</script>

<Dialog bind:open dismissable={false} class="flex flex-col p-0 max-w-xl max-h-64 overflow-hidden">
	<div class="flex items-center border-b px-2">
		<Search class="size-4 shrink-0 opacity-50" />
		<input
			bind:value={commandState.search}
			onkeydown={(e) => commandState.handleInputKeydown(e)}
			{id}
			type="text"
			role="combobox"
			aria-expanded="true"
			aria-autocomplete="list"
			aria-controls={commandRef?.id ?? undefined}
			autocomplete="off"
			autocorrect="off"
			spellcheck={false}
			{placeholder}
			class={[
				'h-11 w-full py-3 px-1 bg-transparent rounded-md text-sm outline-none',
				'disabled:cursor-not-allowed disabled:opacity-50',
				'placeholder:text-muted-foreground'
			]}
		/>
		<button
			onclick={close}
			class={[
				'p-1 rounded-md bg-transparent text-secondary-foreground',
				'[&_svg]:opacity-60 hover:bg-secondary/10 hover:[&_svg]:opacity-100'
			]}
		>
			<X class="size-4 shrink-0" />
		</button>
	</div>

	<!-- {#if commandState.hasResult} -->
	<div
		bind:this={commandRef}
		role="listbox"
		tabindex="-1"
		onkeydown={(e) => commandState.handleKeydown(e)}
		class=" grow flex flex-col overflow-auto"
	>
		{@render children()}
	</div>
	<!-- {:else}
		<div class="py-6 text-center text-sm">Not found</div>
	{/if} -->
</Dialog>
