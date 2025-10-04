<script lang="ts">
	import Bolt from 'lucide-svelte/icons/bolt';
	import CheckSquare2 from 'lucide-svelte/icons/check-square-2';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import FileMinus from 'lucide-svelte/icons/file-minus';
	import FolderMinus from 'lucide-svelte/icons/folder-minus';
	import Plus from 'lucide-svelte/icons/plus';
	import Square from 'lucide-svelte/icons/square';
	import { Color, PropertyType, type Property } from '@prisma/client';
	import { Items, getItemState, groupItemsByPropertyValue } from '$lib/components/items/index.js';
	import { getOption, getPropertyColor, getPropertyState } from '$lib/components/property/index.js';
	import debounce from 'debounce';
	import { goto, preloadData, pushState } from '$app/navigation';
	import type { RouterInputs } from '$lib/trpc/router';
	import { tm, noCheck } from '$lib/utils/index.js';
	import {
		Accordion,
		AccordionItem,
		Breadcrumb,
		BreadcrumbItem,
		Button,
		IconPicker,
		Shortcut
	} from '$lib/components/base/index.js';
	import {
		PageContainer,
		PageContent,
		PageFooter,
		PageHeader,
		PageTitle
	} from '$lib/components/page/index.js';
	import { page } from '$app/state';
	import {
		COLLECTION_PAGE_PANEL_CTX_KEY,
		DEBOUNCE_INTERVAL,
		MAX_COLLECTION_NAME_LENGTH,
		PROPERTY_COLORS,
		SCREEN_LG_MEDIA_QUERY
	} from '$lib/constant/index.js';
	import { CollectionMenu, getCollectionState } from '$lib/components/collection/index.js';
	import { ModalState } from '$lib/states/index.js';
	import ItemPage from './item/[itemid=id]/+page.svelte';
	import SettingsPage from './settings/+page.svelte';
	import { getContext, onMount, tick } from 'svelte';
	import { escapeKeydown, textareaAutoSize } from '$lib/actions/index.js';
	import { getNameSchema } from '$lib/schema';
	import { MediaQuery } from 'svelte/reactivity';
	import {
		SearchInput,
		ViewButtons,
		ViewSettingsMenu,
		getViewState
	} from '$lib/components/view/index.js';
	import { getSidebarState, SidebarOpenBtn } from '$lib/components/sidebar/index.js';

	let { data } = $props();

	const collectionState = getCollectionState();
	const viewState = getViewState();
	const propertyState = getPropertyState();
	const itemState = getItemState();
	const sidebarState = getSidebarState();

	const collection = $derived(collectionState.getCollection(data.cid)!);
	const view = $derived(viewState.getViewByShortId(viewState.viewShortId)!);
	const isEmpty = $derived(isCollectionEmpty());

	let search = $state('');

	let items = $derived.by(() => {
		const searchTerm = search.toLowerCase() || '';
		return [...itemState.items].filter((item) => item.name.toLowerCase().includes(searchTerm));
	});

	let itemName = $state('');
	let renameCollectionError = $state<string | null>(null);

	let isSmHeadingVisible = $state(false);
	let isNewItemInputVisible = $state(false);

	type PanelContentType = 'item' | 'settings' | null;

	let panelContentType = $state<PanelContentType>(null);
	const panelState = getContext<ModalState>(COLLECTION_PAGE_PANEL_CTX_KEY);

	const isLargeScreen = new MediaQuery(SCREEN_LG_MEDIA_QUERY, false);

	async function updCollection(args: Omit<RouterInputs['collections']['update'], 'id'>) {
		await collectionState.updCollection({ ...args, id: collection.id });
	}
	const updCollectionDebounced = debounce(updCollection, DEBOUNCE_INTERVAL);

	async function handleOnInputCollectionName(e: Event) {
		const targetEl = e.target as HTMLInputElement;

		const parseResult = getNameSchema({
			label: 'Collection name',
			max: MAX_COLLECTION_NAME_LENGTH
		}).safeParse(targetEl.value);

		if (!parseResult.success) {
			renameCollectionError = parseResult.error.issues[0].message;
			return;
		}
		renameCollectionError = null;

		updCollectionDebounced({ name: targetEl.value });
	}

	async function handleOnInputCollectionDesc(e: Event) {
		const description = (e.target as HTMLTextAreaElement).value;

		updCollectionDebounced({ description });
	}

	async function handleCreateItem(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();

		await itemState.createItem({
			name: itemName,
			collectionId: collection.id
		});
		itemName = '';
	}

	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}

	async function onClickOpenSettings() {
		if (panelState.isOpen) history.back();

		const url = `/collections/${collection.id}/settings`;
		if (!isLargeScreen.current) {
			goto(url);
			return;
		}

		const result = await preloadData(url);
		if (result.type === 'loaded' && result.status === 200) {
			pushState(url, { insidePanel: true });
			panelContentType = 'settings';
			if (!panelState.isOpen) panelState.open();
		} else {
			goto(url);
		}
	}

	async function clickItem(id: string) {
		if (panelState.isOpen) history.back();
		itemState.active = id;
		const url = `/collections/${collection.id}/item/${id}`;
		if (!isLargeScreen.current) {
			await goto(url);
			return;
		}

		const result = await preloadData(url);
		if (result.type === 'loaded' && result.status === 200) {
			pushState(url, { id: result.data.id, insidePanel: true });
			panelContentType = 'item';
			if (!panelState.isOpen) panelState.open();
		} else {
			await goto(url);
		}
	}

	async function onClickCreateItemAdvance() {
		const id = await itemState.createItem({
			name: '',
			collectionId: collection.id
		});
		if (!id) return;
		await clickItem(id);
	}

	// View
	const VIEW_STORAGE_KEY = $derived(`collection-${collection.id}-view`);
	async function onViewChange(value: string) {
		if (panelState.isOpen) {
			await new Promise<void>((resolve) => {
				const handleNavigation = () => {
					window.removeEventListener('popstate', handleNavigation);
					resolve();
				};
				window.addEventListener('popstate', handleNavigation);
				panelState.close();
				history.back();
			});
		}

		localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(+value));
		page.url.searchParams.set('view', value);
		await goto(`?${page.url.searchParams.toString()}`);
		await itemState.refresh(+value);
		viewState.viewShortId = +value;
		itemState.viewShortId = +value;
	}

	function isCollectionEmpty() {
		return itemState.items.length === 0 && viewState.views.every((v) => v.filters.length === 0);
	}

	$effect(() => {
		data.cid;
		search = '';
	});

	$effect(() => {
		if (!isNewItemInputVisible) return;

		const inputEl = document.getElementById('new-item-name') as HTMLInputElement;
		tick().then(() => inputEl.focus());
	});

	onMount(() => {
		function handleKeydown(e: KeyboardEvent) {
			if (e.altKey && e.key === 'n') {
				e.preventDefault();
				isNewItemInputVisible = true;
			} else if (e.ctrlKey && e.altKey && e.key === 'm') {
				e.preventDefault();
				onClickCreateItemAdvance();
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<svelte:head>
	<title>{collection.name} - Stackbold</title>
</svelte:head>

<PageContainer class={tm(panelState.isOpen && 'w-0 md:w-1/2')}>
	<PageHeader class={tm(sidebarState.isOpen && 'lg:justify-end')}>
		<SidebarOpenBtn />

		<Button theme="ghost" variant="icon" class="lg:hidden" onclick={() => history.back()}>
			<ChevronLeft />
		</Button>

		<Breadcrumb class="hidden lg:flex">
			<BreadcrumbItem icon="collections" name="Collections" link="/collections" />
			<BreadcrumbItem icon={collection.icon} name={collection.name} last />
		</Breadcrumb>

		<PageTitle
			small
			icon={collection.icon}
			title={collection.name}
			class={isSmHeadingVisible ? 'grow flex lg:hidden' : 'hidden'}
		/>

		<div class="flex justify-end items-center space-x-1.5">
			<Button theme="secondary" variant="icon" onclick={() => onClickOpenSettings()}>
				<Bolt />
			</Button>
			<CollectionMenu {collection} />
		</div>
	</PageHeader>

	<PageContent class="relative" onscroll={handleScroll}>
		<div class=" flex items-center space-x-2">
			<IconPicker name={collection.icon} onIconChange={(icon) => updCollection({ icon })} />

			<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
			<input
				role="heading"
				aria-level="1"
				value={collection.name}
				type="text"
				maxlength={MAX_COLLECTION_NAME_LENGTH}
				oninput={handleOnInputCollectionName}
				class="grow font-semibold text-2xl md:text-3xl focus:outline-none bg-transparent"
			/>
		</div>
		{#if renameCollectionError}
			<span class="text-primary"> {renameCollectionError}</span>
		{/if}
		{#if !collection.isDescHidden}
			<label for="description" class="sr-only"> Collection description </label>

			<textarea
				use:textareaAutoSize
				id="description"
				value={collection.description}
				oninput={handleOnInputCollectionDesc}
				spellcheck={false}
				class="textarea textarea-ghost"
			></textarea>
		{/if}

		<div class="flex justify-between gap-x-1.5 pb-1.5 bg-card">
			<ViewButtons
				views={viewState.views}
				value={view.shortId.toString()}
				onchange={onViewChange}
			/>

			<SearchInput placeholder="Find Item" bind:value={search} />

			<ViewSettingsMenu {view} />
		</div>

		{#if isEmpty || items.length === 0}
			{@render noItem()}
		{:else if !view.groupBy}
			<Items {view} {items} clickOpenItem={(id) => clickItem(id)} />
		{:else}
			{@const groupedItems = items.reduce(groupItemsByPropertyValue(view.groupBy), {})}
			<Accordion isMulti value={Object.keys(groupedItems).map((k) => `accordion-item-${k}`)}>
				{#each Object.keys(groupedItems) as key (`group-item-${key}`)}
					{@const property = propertyState.getProperty(groupedItems[key].pid)}

					{#if property}
						{@const color = getPropertyColor(property, key)}
						<AccordionItem id={`accordion-item-${key}`}>
							{#snippet header()}
								{@render groupLabel(key, property, color)}
							{/snippet}
							<Items {view} items={groupedItems[key].items} clickOpenItem={(id) => clickItem(id)} />
						</AccordionItem>
					{/if}
				{/each}
			</Accordion>
		{/if}
	</PageContent>
	<PageFooter class="w-full flex gap-x-0.5">
		{#if isNewItemInputVisible}
			<form onsubmit={handleCreateItem} class="grow relative">
				<label for="new-item-name" class="sr-only"> Item name</label>
				<input
					bind:value={itemName}
					use:escapeKeydown
					id="new-item-name"
					name="new-item-name"
					placeholder="New item"
					autocomplete="off"
					class="h-9 w-full px-2 text-base font-semibold rounded-sm bg-secondary placeholder:text-primary focus:placeholder:text-secondary-foreground focus:outline-none"
					onfocusout={() => (isNewItemInputVisible = false)}
					onescapekey={() => (isNewItemInputVisible = false)}
				/>
			</form>
		{:else}
			<Button
				theme="secondary"
				class="grow flex justify-between items-center text-left font-semibold text-secondary-foreground"
				onclick={() => (isNewItemInputVisible = true)}
			>
				<Plus />
				<span class="grow"> New item </span>
				<Shortcut>
					<span>Alt</span>
					<span>N</span>
				</Shortcut>
			</Button>
		{/if}
	</PageFooter>
</PageContainer>

<!-- Sliding panel -->
<aside
	class={tm(
		'h-full flex flex-col space-y-2 overflow-hidden',
		'rounded-md bg-card text-card-foreground transition-all duration-300',
		panelState.isOpen ? 'w-full md:w-2/6 ml-1.5' : 'w-0'
	)}
>
	{#if panelContentType === 'item' && page.state.id}
		<ItemPage data={noCheck(page.state)} />
	{:else if panelContentType === 'settings'}
		<SettingsPage data={noCheck(page.state)} />
	{/if}
</aside>

{#snippet groupLabel(key: string, property: Property, color: Color)}
	<span
		class={tm('h-6 flex items-center py-1 px-1.5 rounded-sm font-semibold', PROPERTY_COLORS[color])}
	>
		{#if property.type === PropertyType.CHECKBOX}
			{#if key === 'true'}
				<CheckSquare2 class="size-4 mr-1.5" />
			{:else}
				<Square class="size-4 mr-1.5 " />
			{/if}

			{property.name}
		{:else}
			{@const option = getOption(property.options, key)}
			{option ? option.value : `No ${property.name}`}
		{/if}
	</span>
{/snippet}

{#snippet noItem()}
	{@const Icon = isEmpty ? FolderMinus : FileMinus}
	{@const text = isEmpty ? 'This collection has no item' : 'There is item to be presented'}

	<div class="h-full flex flex-col justify-center items-center">
		<Icon class="size-12" />
		<span class="text-xl font-semibold"> {text}</span>
	</div>
{/snippet}
