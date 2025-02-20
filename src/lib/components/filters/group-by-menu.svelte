<script lang="ts">
	import Rows from 'lucide-svelte/icons/rows-3';
	import { buttonVariants, HSeparator, Menu, Radio } from '$lib/components/base/index.js';
	import { getPropertyState, PropertyIcon } from '$lib/components/property';
	import { ModalState } from '$lib/states/index.js';

	type Props = {
		value: string;
		updValue: (propId: string) => void;
	};

	let { value, updValue }: Props = $props();
	const propertyState = getPropertyState();

	const menuState = new ModalState();

	function handleOnclick(value: string) {
		updValue(value);
		menuState.close();
	}
</script>

<Menu
	bind:open={menuState.isOpen}
	triggerClass={buttonVariants({ theme: 'secondary' })}
	align="end"
>
	{#snippet trigger()}
		<Rows class="block md:hidden" />
		<span class="hidden md:block"> Group by </span>
	{/snippet}
	<p class="py-1.5 px-2 text-sm font-semibold">Group by</p>

	<HSeparator />

	{#each propertyState.properties as property (property.id)}
		{#if property.type === 'SELECT' || property.type === 'CHECKBOX'}
			<Radio checked={value === property.id} onclick={() => handleOnclick(property.id)}>
				<PropertyIcon key={property.type} class="size-5" />
				<span class="grow"> {property.name} </span>
			</Radio>
		{/if}
	{/each}

	<Radio checked={value === 'none'} onclick={() => handleOnclick('')}>
		<PropertyIcon key="none" class="size-5" />
		<span class="grow">None</span>
	</Radio>
</Menu>
