<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Settings from 'lucide-svelte/icons/settings-2';
	import ListCollapse from 'lucide-svelte/icons/list-collapse';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';
	import { ModalState } from '$lib/states/index.js';
	import {
		AdaptiveWrapper,
		Button,
		buttonVariants,
		HSeparator,
		Label,
		MenuTitle,
		RadioGroup,
		RadioGroupItem,
		Switch,
		Tooltip
	} from '$lib/components/base/index.js';
	import type { View } from '@prisma/client';
	import {
		getPropertyState,
		isPropertyVisible,
		PropertyIcon
	} from '$lib/components/property/index.js';
	import { getViewState } from './index.js';
	import { useId } from '$lib/utils/index.js';
	import { FILTERABLE_PROPERTY_TYPES } from '$lib/constant/index.js';
	import { GripVertical } from 'lucide-svelte';

	type Props = {
		view: View;
	};

	type ContentType = 'entries' | 'groups' | 'visibility';

	let { view }: Props = $props();
	let content = $state<ContentType>('entries');

	const id = useId();
	const menuState = new ModalState();
	const propertyState = getPropertyState();
	const viewState = getViewState();
	const properties = $derived.by(getFilterableProperties);

	function getFilterableProperties() {
		return propertyState.properties.filter((prop) => FILTERABLE_PROPERTY_TYPES.includes(prop.type));
	}

	async function togglePropertyVisibility(pid: string) {
		const properties = view.properties.map((p) =>
			p.id !== pid ? p : { ...p, isVisible: !p.isVisible }
		);
		await viewState.updView({ id: view.id, properties });
	}

	async function updViewGroupBy(value: string) {
		menuState.close();
		content = 'entries';
		await viewState.updView({ id: view.id, groupBy: value === 'none' ? null : value });
	}
</script>

<Tooltip triggerBy={id} align="end">
	<span class="text-sm font-semibold py-1 px-1.5">Settings</span>
</Tooltip>
<AdaptiveWrapper
	{id}
	bind:open={menuState.isOpen}
	triggerClass={buttonVariants({ theme: 'secondary', variant: 'icon' })}
	floatingAlign="end"
>
	{#snippet trigger()}
		<Settings />
	{/snippet}
	{#if content === 'entries'}
		<MenuTitle title="View settings" />

		<Button theme="ghost" variant="menu" onclick={() => (content = 'visibility')}>
			<ToggleRight />
			<span> Property Visibility </span>
		</Button>

		<Button theme="ghost" variant="menu" onclick={() => (content = 'groups')}>
			<ListCollapse />
			<span> Group </span>
		</Button>
	{:else if content === 'visibility'}
		{@render header('Properties')}
		{#each propertyState.properties as property}
			<div draggable="true" class="flex justify-between items-center pr-1">
				<Label for={property.id} name={property.name} icon={property.type.toLowerCase()} />
				<Switch
					id={property.id}
					checked={isPropertyVisible(view, property.id)}
					onchange={() => togglePropertyVisibility(property.id)}
				/>
			</div>
		{/each}
	{:else if content === 'groups'}
		{@render header('Group By')}

		<RadioGroup value={view.groupBy ?? 'none'} onchange={updViewGroupBy}>
			{#each properties as property (property.id)}
				{@const id = useId(`group-by-${property.id}`)}
				<Label for={id} compact hoverEffect>
					<PropertyIcon key={property.type} />
					<span class="grow"> {property.name} </span>
					<RadioGroupItem {id} value={property.id} />
				</Label>
			{/each}
			<Label for="collection-group-by-none" compact hoverEffect>
				<PropertyIcon key="none" />
				<span class="grow">None</span>
				<RadioGroupItem id="collection-group-by-none" value="none" />
			</Label>
		</RadioGroup>
	{/if}
</AdaptiveWrapper>

{#snippet header(title: string)}
	<div class="w-full flex items-center gap-x-0.5 px-1 pt-1">
		<Button theme="ghost" variant="compact" onclick={() => (content = 'entries')}>
			<ChevronLeft />
		</Button>
		<span class="pl-0.5 pr-2.5 py-1 font-semibold text-sm">
			{title}
		</span>
	</div>
	<HSeparator />
{/snippet}
