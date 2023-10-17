<script lang="ts">
	import {
		AdjustmentsHorizontalOutline,
		ArchiveOutline,
		CloseOutline,
		ExclamationCircleOutline,
		EyeSlashOutline,
		FolderDuplicateOutline,
		HeartOutline,
		PenOutline,
		TrashBinOutline,
		UserAddOutline,
		WindowOutline
	} from 'flowbite-svelte-icons';
	import {
		Button,
		Drawer,
		Dropdown,
		DropdownDivider,
		DropdownItem,
		Input,
		Modal
	} from 'flowbite-svelte';
	import ItemProperty from '$lib/components/ItemProperty.svelte';
	import { sineIn } from 'svelte/easing';

	import type { PageData } from './$types';
	import type { Item, ItemProperty as ItemPropertyType } from '@prisma/client';
	import CollectionProperty from '$lib/components/property/CollectionProperty.svelte';
	import IconBtn from '$lib/components/IconBtn.svelte';
	import { trpc } from '$lib/trpc/client';
	import { invalidateAll } from '$app/navigation';

	import toast from 'svelte-french-toast';

	export let data: PageData;

	const defaultPropColor = 'gray';
	let busy = false;
	let drawerSelectedItem: Item | null = null;
	let itemName: string | null = null;

	let selectedItemId: string | null = null;

	const handleOnClickItem = (itemId: string) => {
		hidden = false;
		busy = true;
		const foundedItem = data.items.find((item) => item.id === itemId);
		drawerSelectedItem = foundedItem ? foundedItem : null;

		itemName = drawerSelectedItem && drawerSelectedItem.name;

		// item = await trpc().items.getItem(itemId)
	};

	const getPropValueById = (pid: string, itemProps: ItemPropertyType[]) => {
		const property = itemProps.find((property) => property.id === pid);
		if (!property) return '';
		return property.value;
	};

	const getOptionColor = (pid: string, value: string) => {
		const property = data.collection.properties.find((prop) => prop.id === pid);
		if (!property) return defaultPropColor;

		const option = property.options.find((opt) => opt.value === value);

		if (!option) return defaultPropColor;
		return option.color.toString().toLowerCase();
	};

	// Drawer
	let hidden = true;
	let activateClickOutside = false;
	let backdrop = false;
	let transitionParams = {
		x: 320,
		duration: 300,
		easing: sineIn
	};
	// Drawer

	// Delete Modal
	let isDeleteModalOpen = false;

	const handleOnDeleteItem = async () => {
		if (!selectedItemId) {
			alert('Error');
			return;
		}

		console.log(selectedItemId);
		busy = true;

		await trpc().items.deleteItem.mutate(selectedItemId);
		await invalidateAll();
		busy = false;
		toast.success('item deleted');
	};
</script>

<svelte:head>
	<title>{data.collection.name}</title>
</svelte:head>

<div
	class={`${
		!hidden ? 'w-3/6' : 'w-5/6'
	} ease-in-out duration-300 m-2 ml-0 p-2 rounded-md bg-gray-50`}
>
	<div class="flex items-center space-x-1.5 p-1">
		<h1 class="grow font-semibold text-2xl">
			{data.collection.name}
		</h1>
		<IconBtn>
			<UserAddOutline />
		</IconBtn>

		<IconBtn>
			<HeartOutline class="icon-xs" />
		</IconBtn>

		<IconBtn id="col-adjust-menu">
			<AdjustmentsHorizontalOutline class="icon-xs" />
		</IconBtn>
		<Dropdown placement="left" triggeredBy="#col-adjust-menu" class="w-56 px-3 pb-3">
			<DropdownItem class="dropdown-item">
				<EyeSlashOutline />
				<span> Hide description </span>
			</DropdownItem>

			<DropdownItem class="dropdown-item">
				<PenOutline />
				<span> Rename </span>
			</DropdownItem>

			<DropdownItem class="dropdown-item">
				<FolderDuplicateOutline />
				<span> Duplicate </span>
			</DropdownItem>

			<DropdownItem class="dropdown-item">
				<ArchiveOutline />
				<span> Archive </span>
			</DropdownItem>
			<DropdownDivider />
			<DropdownItem class="dropdown-item dropdown-item-red">
				<TrashBinOutline />
				<span> Delete </span>
			</DropdownItem>
		</Dropdown>
	</div>

	<div>
		{data.collection.description}
	</div>

	<div class="space-y-2 p-1">
		{#each data.items as item}
			<div
				class={` ${
					drawerSelectedItem && drawerSelectedItem.id === item.id
						? 'rounded-l-md bg-gray-100 border-r-4 border-primary-600'
						: 'border rounded'
				} flex flex-col items-start  py-1 px-2 space-y-2 group`}
			>
				<div class="w-full flex justify-between items-center space-x-2">
					<span class="grow text-lg font-semibold">{item.name}</span>

					<IconBtn id={`item-adjust-menu-${item.id}`} extraClass="invisible group-hover:visible">
						<AdjustmentsHorizontalOutline class="icon-xss" />
					</IconBtn>

					<Dropdown triggeredBy={`#item-adjust-menu-${item.id}`} class="w-56 px-3 pb-3">
						<DropdownItem class="dropdown-item">
							<PenOutline />
							<span> Rename item </span>
						</DropdownItem>

						<DropdownItem class="dropdown-item">
							<FolderDuplicateOutline />
							<span> Duplicate item </span>
						</DropdownItem>

						<DropdownDivider />
						<DropdownItem
							on:click={() => {
								isDeleteModalOpen = true;
								selectedItemId = item.id;
							}}
							class="dropdown-item dropdown-item-red"
						>
							<TrashBinOutline />
							<span> Delete item </span>
						</DropdownItem>
					</Dropdown>

					<IconBtn
						on:click={() => handleOnClickItem(item.id)}
						tootipText="Details"
						extraClass="invisible group-hover:visible"
					>
						<WindowOutline class="icon-xss rotate-90" />
					</IconBtn>
				</div>

				<div class="flex flex-wrap gap-2">
					{#each data.collection.properties as prop}
						<ItemProperty
							name={prop.name}
							color={prop.type === 'SELECT'
								? getOptionColor(prop.id, getPropValueById(prop.id, item.properties))
								: defaultPropColor}
							type={prop.type}
							value={getPropValueById(prop.id, item.properties)}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<Drawer
	{activateClickOutside}
	{backdrop}
	placement="right"
	transitionType="fly"
	{transitionParams}
	bind:hidden
	id="itemDrawer"
	class="w-full xl:w-2/6 p-2 bg-gray-200"
>
	<div class="h-full rounded-md bg-gray-50 p-3">
		<div class="flex justify-between items-center">
			<IconBtn on:click={() => (hidden = true)} extraClass="p-4">
				<CloseOutline class="icon-xss" />
			</IconBtn>
			<IconBtn>
				<AdjustmentsHorizontalOutline class="icon-xss" />
			</IconBtn>
		</div>

		<div class="flex flex-col space-y-1 rounded bg-gray-200 p-1 my-4">
			<!-- <Label class=" grow truncate font-semibold">Name</Label> -->
			<Input type="text" value={itemName} class=" rounded-sm text-lg border-none bg-gray-200 " />
		</div>

		<div class="flex flex-col space-y-4">
			{#each data.collection.properties as property}
				<CollectionProperty
					{property}
					value={getPropValueById(
						property.id,
						drawerSelectedItem ? drawerSelectedItem.properties : []
					)}
				/>
			{/each}
		</div>
	</div>
</Drawer>

<Modal bind:open={isDeleteModalOpen} size="xs" autoclose>
	<div class="text-center">
		<ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Are you sure you want to delete this item? {selectedItemId}
		</h3>
		<Button on:click={handleOnDeleteItem} color="red" class="mr-2">Yes, I'm sure</Button>
		<Button color="alternative">No, cancel</Button>
	</div>
</Modal>
