<script lang="ts">
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import { INPUT_ICONS, SLIDE_PARAMS, VIEW_ICONS } from '$lib/constant/index.js';
	import { tm } from '$lib/utils/index.js';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import Grip from 'lucide-svelte/icons/grip-vertical';

	type Props = {
		icon?: string;
		name?: string;
		children: Snippet;
		isExpanded: boolean;
		onclickHeader: () => void;
		ondragEditor: (e: DataTransfer) => void;
		ondropEditor: (e: DataTransfer) => void;
		group?: string;
		header?: Snippet;
	};

	let {
		icon = '',
		name,
		children,
		isExpanded,
		onclickHeader,
		ondragEditor,
		ondropEditor,
		group = '',
		header
	}: Props = $props();

	let dragging = $state(false);
	let dragover = $state(false);

	const Icon = $derived({ ...INPUT_ICONS, ...VIEW_ICONS }[icon.toLowerCase()]);
	function ondragover(e: DragEvent) {
		e.stopPropagation();
		e.preventDefault();
		dragover = true;
	}

	function ondragleave(e: DragEvent) {
		e.preventDefault();
		dragover = false;
	}

	function ondragend() {
		dragging = false;
		dragover = false;
	}

	function ondragstart(e: DragEvent) {
		e.stopPropagation();
		if (!e.dataTransfer) return;
		dragging = true;

		const ghost = e.target as HTMLDivElement;
		ghost.style.opacity = '';
		setTimeout(() => {
			ghost?.style?.removeProperty('opacity'); // restore
		}, 0);
		e.dataTransfer.setDragImage(ghost, 0, 0);
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.dropEffect = 'move';
		ondragEditor(e.dataTransfer);
	}

	async function ondrop(e: DragEvent) {
		e.stopPropagation();
		if (!e.dataTransfer) return;

		dragover = false;
		dragging = false;
		e.dataTransfer.dropEffect = 'move';
		ondropEditor(e.dataTransfer);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	draggable="true"
	{ondragstart}
	{ondrop}
	{ondragend}
	{ondragover}
	{ondragleave}
	class={tm(
		'relative first:rounded-t-md last:rounded-b-md border-secondary',
		isExpanded
			? 'is-open my-3 first:mt-0 last:mb-0 border-2 rounded-md [&+*]:rounded-t-md'
			: 'has-[+.is-open]:rounded-b-md border-x-2 border-t-2 has-[+.is-open]:border-b-2 last:border-b-2',
		(dragging || dragover) && 'opacity-50',
		group ? `group/options` : 'group'
	)}
>
	<div
		class={tm(
			'absolute top-0 left-0 h-8 flex items-center opacity-0 duration-150 -translate-x-2 cursor-pointer',
			group
				? `lg:group-hover/options:-translate-x-4 lg:group-hover/options:opacity-100`
				: 'lg:group-hover:-translate-x-4 lg:group-hover:opacity-100'
		)}
	>
		<Grip class="size-4" />
	</div>

	<div
		class="h-full w-full flex items-center justify-between gap-x-2 py-1 px-1.5 cursor-pointer bg-secondary/50 hover:bg-secondary/70"
		onclick={() => onclickHeader()}
	>
		<Icon class="size-5 lg:size-4" />

		<span class="grow">
			{#if name}
				{name}
			{:else if header}
				{@render header()}
			{/if}
		</span>

		<ChevronRight
			class={tm('size-4 transition-transform', isExpanded ? '-rotate-90' : 'rotate-0')}
		/>
	</div>

	{#if isExpanded}
		<div
			transition:slide={{ ...SLIDE_PARAMS }}
			class="flex flex-col gap-y-2 p-2 border-t-2 border-secondary"
		>
			{@render children()}
		</div>
	{/if}
</div>
