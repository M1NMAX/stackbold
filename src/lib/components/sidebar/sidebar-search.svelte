<script lang="ts">
	import ArrowDownUp from 'lucide-svelte/icons/arrow-down-up';
	import CornerDownLeft from 'lucide-svelte/icons/corner-down-left';
	import Hash from 'lucide-svelte/icons/hash';
	import type { SearchableCollection } from '$lib/types.js';
	import { Dialog, Empty, HSeparator, SearchInput, Shortcut } from '$lib/components/base/index.js';
	import { trpc } from '$lib/trpc/client';
	import { escapeRegex, tm, useId } from '$lib/utils/index.js';
	import { tick } from 'svelte';
	import { getCollectionState, getCollectionView } from '../collection';
	import { COLLECTION_ICONS, DEBOUNCE_INTERVAL } from '$lib/constant';
	import { goto } from '$app/navigation';

	const COMMAND_VALUE_ATTR = 'aria-activedescendant';
	const COMMAND_ITEM_ATTR = '[role="option"]';
	type Ref = HTMLDivElement | null;

	type Option = {
		id: string;
		isSelected: boolean;
		name: string;
		icon?: string;
		onclick: () => void;
		type: 'collection' | 'item';
	};

	type Props = {
		open: boolean;
		placeholder?: string;
	};

	let { open = $bindable() }: Props = $props();
	const collectionState = getCollectionState();

	let search = $state('');
	let result = $state<SearchableCollection[]>([]);
	let filtered = $state<SearchableCollection[]>(preData());
	let hasFetched = $state(false);
	let isLoading = $state(false);

	let selectedItem = $state((() => filtered[0].id)());
	let wrapper = $state<Ref>(null);
	const searchInputId = useId();
	const wrapperId = useId();

	function onpointermove(id: string) {
		selectedItem = id;
	}

	function defocus(element: Ref) {
		if (!element) return;
		element.ariaSelected = 'false';
		element.tabIndex = 0;
	}

	function focus(element: Ref) {
		if (!wrapper || !element) return;
		if (selectedItem) defocus(document.getElementById(selectedItem) as Ref);
		element.ariaSelected = 'true';
		element.tabIndex = -1;
		wrapper.setAttribute(COMMAND_VALUE_ATTR, element.id);
		selectedItem = element.id;
	}

	function focusFirstItem() {
		if (!wrapper) return;
		wrapper.tabIndex = 0;

		const firstItem = wrapper.querySelector(COMMAND_ITEM_ATTR) as Ref;
		if (!firstItem) return;

		focus(firstItem);
	}

	function updScroll() {
		const item = document.getElementById(selectedItem) as Ref;
		if (!item) return;
		item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!wrapper) return;

		const current = document.getElementById(selectedItem) as Ref;
		if (!current) return;

		let next = current;
		if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'j')) {
			e.preventDefault();
			next = current.nextElementSibling as HTMLDivElement;
		} else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'k')) {
			e.stopPropagation();
			e.preventDefault();
			next = current.previousElementSibling as HTMLDivElement;
		} else if (e.key === 'Enter') {
			current.click();
		}

		if (!next) return;
		focus(next);
		updScroll();
	}

	function preData() {
		return [...collectionState.collections]
			.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
			.map((c) => ({
				id: c.id,
				name: c.name,
				icon: c.icon,
				items: [],
				views: c.views.map((v) => ({ shortId: v.shortId }))
			}));
	}

	$effect(() => {
		const escaped = escapeRegex(search);
		const pattern = new RegExp(escaped, 'i');
		function applyFilter(data: SearchableCollection[]) {
			return data.filter((e) => pattern.test(e.name) || e.items.some((i) => pattern.test(i.name)));
		}

		if (escaped.length < 3) {
			result = [];
			filtered = preData();
			hasFetched = false;
			return;
		}

		if (hasFetched) {
			filtered = applyFilter(result);
			return;
		}

		let cancelled = false;
		isLoading = true;
		const timer = setTimeout(async () => {
			try {
				const data = await trpc().collections.search.query(escaped);
				if (cancelled) return;

				result = data;
				filtered = applyFilter(data);
				hasFetched = true;
			} catch (err) {
				if (!cancelled) console.log(err);
			} finally {
				if (!cancelled) isLoading = false;
			}
		}, DEBOUNCE_INTERVAL / 4);

		return () => {
			cancelled = true;
			clearTimeout(timer);
			isLoading = false;
		};
	});

	$effect(() => {
		if (!open) return;
		const inputEl = document.getElementById(searchInputId) as HTMLInputElement;
		if (!inputEl) return;
		tick().then(() => inputEl.focus());
	});

	$effect(() => {
		if (filtered.length <= 0) return;
		tick().then(() => focusFirstItem());
	});
</script>

<Dialog
	bind:open
	dismissable={false}
	class="flex flex-col p-0 gap-y-0 h-80 max-w-xl overflow-hidden"
>
	<SearchInput
		id={searchInputId}
		bind:value={search}
		variant="ghost"
		onkeydown={(e) => handleKeydown(e)}
		type="text"
		role="combobox"
		aria-expanded="true"
		aria-autocomplete="list"
		aria-controls={wrapperId}
		autocomplete="off"
		autocorrect="off"
		spellcheck={false}
	/>

	<HSeparator class="my-0" />

	<div class="grow p-1 overflow-y-auto">
		{#if isLoading}
			{@render skeleton()}
		{:else if filtered.length > 0}
			{@const isRecent = result.length === 0}
			<p class="text-sm font-medium px-0.5 pb-1">{isRecent ? 'Recents' : 'Results'}</p>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				id={wrapperId}
				bind:this={wrapper}
				role="list"
				tabindex="-1"
				class="grow flex flex-col"
				onkeydown={(e) => handleKeydown(e)}
			>
				{#each filtered as collection}
					{@render option({
						id: collection.id,
						isSelected: collection.id === selectedItem,
						name: collection.name,
						icon: collection.icon,
						type: 'collection',
						onclick: () =>
							goto(`/collections/${collection.id}?view=${getCollectionView(collection)}`)
					})}
					{#each collection.items as item}
						{@render option({
							id: item.id,
							isSelected: item.id === selectedItem,
							name: item.name,
							type: 'item',
							onclick: () => goto(`/collections/${collection.id}/item/${item.id}`)
						})}
					{/each}
				{/each}
			</div>
		{:else}
			{@const isSearchResult = search.length > 3 && filtered.length === 0}
			<Empty text={isSearchResult ? 'No results' : 'There has been no recent activity'} />
		{/if}
	</div>
	<HSeparator class="my-0" />

	<div class="flex items-center gap-x-3 p-1">
		<Shortcut label="Select">
			<ArrowDownUp />
		</Shortcut>
		<Shortcut label="Open">
			<CornerDownLeft />
		</Shortcut>
	</div>
</Dialog>

{#snippet option(opt: Option)}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		id={opt.id}
		role="option"
		aria-selected={opt.isSelected}
		tabindex="-1"
		onpointermove={() => onpointermove(opt.id)}
		class={tm(
			'aria-selected:bg-secondary aria-selected:text-secondary-foreground w-full flex cursor-default select-none items-center  rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
			opt.type === 'item' ? 'pl-4' : ''
		)}
		onclick={() => {
			open = false;
			opt.onclick();
		}}
	>
		{#if opt.type === 'item'}
			<span
				class="relative flex-shrink-0 w-3 h-5 before:absolute before:left-0 before:-top-2.5 before:bottom-1/2 before:w-2 before:h-full before:border-l before:border-b before:rounded-bl-sm before:border-secondary-foreground"
			>
			</span>
		{/if}

		{#if opt.icon}
			{@const Icon = COLLECTION_ICONS[opt.icon]}
			<Icon />
		{:else}
			<Hash />
		{/if}

		<span class="ml-2"> {opt.name}</span>
	</div>
{/snippet}

{#snippet skeleton()}
	<div class="flex flex-col gap-y-2 p-1">
		{#each { length: 7 } as s}
			<div class="h-6 w-full flex items-center gap-x-2">
				<span class="size-5 rounded-md bg-card"> </span>
				<span class=" grow h-5 rounded-md bg-card"> </span>
			</div>
		{/each}
	</div>
{/snippet}
