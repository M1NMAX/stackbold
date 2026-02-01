<script module>
	let currentlyEditing = $state('');
</script>

<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import PencilLine from 'lucide-svelte/icons/pencil-line';
	import { PropertyType, type Item, type View } from '@prisma/client';
	import { getItemState, groupItemsByPropertyValue, ItemMenu } from './index.js';
	import { getPropertyState, PropertyValue } from '$lib/components/property/index.js';
	import { Badge, Button, MockCheckbox } from '$lib/components/base/index.js';
	import {
		getOption,
		getPropertyColor,
		getPropertyRef,
		isPropertyVisible,
		tm
	} from '$lib/utils/index.js';
	import { escapeKeydown, enterKeydown, clickOutside } from '$lib/actions/index.js';

	import type { ClickItemEvent } from '$lib/types.js';
	import debounce from 'debounce';
	import { DEBOUNCE_INTERVAL, MAX_ITEM_NAME_LENGTH } from '$lib/constant/index.js';
	import type { RouterInputs } from '$lib/trpc/router';

	type Props = {
		view: View;
		items: Item[];
		clickOpenItem: (id: string) => void;
	};

	let { view, items, clickOpenItem }: Props = $props();
	const propertyState = getPropertyState();
	const itemState = getItemState();

	//TODO: groupBy required in board view
	const groupedItems = $derived(items.reduce(groupItemsByPropertyValue(view.groupBy ?? ''), {}));
	const mainProperty = $derived(propertyState.getProperty(view.groupBy ?? ''));

	const updItemDebounced = debounce(updItem, DEBOUNCE_INTERVAL);
	async function updItem(args: RouterInputs['items']['update']) {
		await itemState.updItem(args);
	}

	function handleOnInput(e: Event) {
		e.stopPropagation();
		const targetEl = e.target as HTMLInputElement;

		const id = targetEl.dataset.id!;
		const name = targetEl.value;
		updItemDebounced({ id, name });
	}
	function onClickItemBody(e: ClickItemEvent, id: string) {
		if (e.target === e.currentTarget || e.target === e.currentTarget.firstChild) {
			clickOpenItem(id);
		}
	}

	async function saveAndClose(target: HTMLInputElement) {
		const id = target.dataset.id!;
		const name = target.value;
		await updItem({ id, name });
		stopEditing();
	}

	function isCurrentlyEditing(id: string) {
		return currentlyEditing === id;
	}

	function startEditing(id: string) {
		currentlyEditing = id;
	}

	function stopEditing() {
		currentlyEditing = '';
	}

	$effect(() => {
		if (currentlyEditing) {
			document.getElementById(currentlyEditing)?.focus();
		}
	});
</script>

<div class="flex gap-x-2 overflow-x-auto hd-scroll">
	{#if mainProperty}
		{#each Object.keys(groupedItems) as key (key)}
			{@const color = getPropertyColor(mainProperty, key)}
			<div class="h-fit flex flex-col items-start gap-2 p-2 rounded-md bg-secondary/30">
				<Badge {color}>
					{#if mainProperty.type == PropertyType.CHECKBOX}
						<MockCheckbox checked={key === 'true'} />
						{mainProperty.name}
					{:else}
						{@const option = getOption(mainProperty.options, key)}
						{option ? option.value : `No ${mainProperty.name}`}
					{/if}
				</Badge>

				<div class="flex flex-col gap-y-2">
					{#each groupedItems[key].items as item (item.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							use:escapeKeydown
							use:enterKeydown
							tabindex="0"
							role="button"
							onclick={(e) => onClickItemBody(e, item.id)}
							onescapekey={(e) => saveAndClose(e.target as HTMLInputElement)}
							onenterkey={(e) => saveAndClose(e.target as HTMLInputElement)}
							class={tm(
								'relative w-80 flex flex-col items-start p-2 gap-y-2 rounded-md bg-secondary bg-opacity-80 dark:bg-opacity-40 hover:bg-secondary/40 dark:hover:bg-secondary/60 group',
								item.id === itemState.active && 'border-primary bg-secondary/80'
							)}
						>
							{#if isCurrentlyEditing(item.id)}
								<input
									use:clickOutside
									id={item.id}
									data-id={item.id}
									value={item.name}
									maxlength={MAX_ITEM_NAME_LENGTH}
									oninput={handleOnInput}
									onclickoutside={(e) => saveAndClose(e.target as HTMLInputElement)}
									onclick={(e) => e.stopPropagation()}
									class="w-full p-1 pr-7 text-lg font-semibold focus:outline-none rounded-md"
								/>

								<Button
									theme="ghost"
									onclick={() => {
										const target = document.getElementById(item.id) as HTMLInputElement;
										saveAndClose(target);
									}}
									class="absolute right-1"
								>
									<Check />
								</Button>
							{:else}
								<p class="text-lg font-semibold max-w-full truncate">
									{item.name}
								</p>

								<div
									class="absolute right-1 top-1 flex items-center gap-x-1 lg:invisible lg:group-hover:visible"
								>
									<Button theme="ghost" onclick={() => startEditing(item.id)}>
										<PencilLine />
									</Button>

									<ItemMenu id={item.id} name={item.name} {clickOpenItem} align="start" />
								</div>
							{/if}

							<div class="flex flex-col flex-wrap gap-2">
								{#each propertyState.properties as property (property.id)}
									{#if isPropertyVisible(view, property.id)}
										{@const propertyRef = getPropertyRef(item.properties, property.id)}
										{#if propertyRef}
											<PropertyValue {item} {property} {view} />
										{/if}
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/if}
</div>
