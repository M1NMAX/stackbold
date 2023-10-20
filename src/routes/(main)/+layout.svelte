<script lang="ts">
	import {
		Sidebar,
		SidebarWrapper,
		SidebarGroup,
		Badge,
		Avatar,
		Button,
		Modal,
		Label,
		Input
	} from 'flowbite-svelte';
	import {
		CaretSortSolid,
		ChervonDoubleRightSolid,
		ChevronSortOutline,
		ChevronSortSolid,
		CogOutline,
		DnaOutline,
		GridOutline,
		HomeOutline,
		PlusOutline,
		SearchOutline
	} from 'flowbite-svelte-icons';

	import { page } from '$app/stores';
	import { SidebarCollection, SidebarItem } from '$lib/components';
	import toast from 'svelte-french-toast';
	import { trpc } from '$lib/trpc/client';
	import { TRPCClientError } from '@trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';
	import IconBtn from '$lib/components/IconBtn.svelte';

	export let data: LayoutData;

	let error: { message: string; path: string[] }[] | null = null;

	$: favourites = data.collections.filter((collection) => collection.isFavourite);

	$: activeUrl = $page.url.pathname;
	$: activeCollection = (id: string) => $page.url.pathname === `/collections/${id}`;

	let createCollectionModal = false;

	const handleSubmit = async (e: { currentTarget: HTMLFormElement }) => {
		const formData = new FormData(e.currentTarget);

		const name = formData.get('name') as string;
		//TODO: input validation

		try {
			const collection = await trpc().collections.createCollection.mutate({ name });

			await invalidateAll();
			createCollectionModal = false;
			toast.success('Collection created successfully');

			console.log(collection);
			setTimeout(() => goto(`/collections/${collection.id}`), 1000);
		} catch (err) {
			if (err instanceof TRPCClientError) error = JSON.parse(err.message);
			else throw err;

			toast.error('Something wrong ');
		}
	};
</script>

<div class=" h-screen flex bg-gray-200">
	<Sidebar class="w-1/6">
		<SidebarWrapper class="h-full flex flex-col space-y-4 px-2 py-1.5  rounded-none bg-gray-200">
			<SidebarGroup>
				<div class="flex space-x-1">
					<button class="relative px-1 py-0.5 rounded bg-gray-300 hover:bg-gray-100 text-black">
						<Avatar
							src={`https://api.dicebear.com/7.x/shapes/svg?seed=${data.user.name}`}
							class=" rounded-full h-7 w-7"
						/>
						<CaretSortSolid class="absolute right-0 bottom-0 w-3 h-3" />
					</button>
					<button class="grow flex items-center space-x-4 p-1.5 rounded-md bg-gray-300">
						<SearchOutline class="icon-xss" />
						<span class="font-semibold"> Quick Search </span>
					</button>
				</div>

				<SidebarItem label="Home" href="/" active={activeUrl === '/'}>
					<svelte:fragment slot="icon">
						<HomeOutline class="icon-sm" />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Templates" active={activeUrl === '/templates'}>
					<svelte:fragment slot="icon">
						<DnaOutline class="icon-sm" />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem
					label="My Collections"
					href="/collections"
					active={activeUrl === '/collections'}
				>
					<svelte:fragment slot="icon">
						<GridOutline class="icon-sm" />
					</svelte:fragment>
				</SidebarItem>
			</SidebarGroup>

			<!-- <SidebarGroup>
				<span class="flex justify-between">
					<span> Favourites </span>

					<span>
						{favourites.length}
					</span>
					<IconBtn><PlusOutline /></IconBtn>
				</span>
				{#each favourites as collection}
					<SidebarCollection {collection} active={activeCollection(collection.id)} />
				{/each}
			</SidebarGroup> -->

			<SidebarGroup class="grow overflow-y-auto">
				<span class="sticky top-0 flex justify-between items-center bg-gray-200">
					<a
						href="/collections"
						class={`${
							activeUrl === '/collections' && 'bg-gray-300 dark:bg-gray-600'
						} font-semibold text-sm grow p-1 rounded hover:bg-gray-300
					dark:hover:bg-gray-500 transition duration-75 dark:text-gray-400`}
					>
						All Collections
					</a>
					<IconBtn
						on:click={() => (createCollectionModal = true)}
						tootipText="Create collection"
						size="xxs"
					>
						<PlusOutline />
					</IconBtn>
				</span>
				<div>
					{#each data.collections as collection}
						<SidebarCollection {collection} active={activeCollection(collection.id)} />
					{/each}
				</div>
			</SidebarGroup>
		</SidebarWrapper>
	</Sidebar>

	<slot />
</div>

<Modal bind:open={createCollectionModal} size="xs" autoclose={false} class="w-full">
	<form on:submit|preventDefault={handleSubmit} class="flex flex-col space-y-6">
		<h3 class="mb-2 text-xl font-medium text-gray-900 dark:text-white">New collection</h3>
		<Label class="space-y-2">
			<span>Name</span>
			<Input type="text" name="name" placeholder="Tasks" required />
		</Label>

		<Button type="submit" class="w-full">Create</Button>
	</form>
</Modal>
