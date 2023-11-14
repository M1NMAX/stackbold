<script lang="ts">
	import {
		ArrowRightToBracketOutline,
		ChevronDoubleLeftOutline,
		CirclePlusOutline,
		CogOutline,
		DatabaseOutline,
		DnaOutline,
		HomeOutline,
		PlusOutline,
		SearchOutline
	} from 'flowbite-svelte-icons';

	import { page } from '$app/stores';
	import {
		Dropdown,
		DropdownDivider,
		DropdownItem,
		IconBtn,
		Modal,
		Sidebar,
		SidebarCollection,
		SidebarItem
	} from '$lib/components';
	import toast from 'svelte-french-toast';
	import { trpc } from '$lib/trpc/client';
	import { TRPCClientError } from '@trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { enhance } from '$app/forms';

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
			const collection = await trpc().collections.create.mutate({
				name,
				isFavourite: true
			});

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

	const sidebarStateStore = writable(true);
	setContext('sidebarStateStore', sidebarStateStore);
</script>

<div class="h-screen flex bg-gray-200">
	<Sidebar class={`${$sidebarStateStore ? 'w-64' : 'w-0'} transition-all`}>
		<div class="h-full flex flex-col space-y-4 overflow-hidden px-0 py-1.5 rounded-none bg-gray-50">
			<div class="space-y-0.5 px-0">
				<div class="w-full flex justify-between space-x-0.5 px-1">
					<Dropdown alighEnd={false}>
						<button slot="button" class="relative w-44 btn btn-sm">
							<span class="flex justify-start items-center space-x-1.5">
								<img
									src={`https://api.dicebear.com/7.x/shapes/svg?seed=${data.user.name}`}
									class=" rounded-full h-6 w-6"
									alt="avatar"
								/>
								<span class="grow font-semibold">{data.user.name}</span>
							</span>
						</button>
						<svelte:fragment>
							<DropdownItem href="/settings">
								<CogOutline />
								<span> Settings </span>
							</DropdownItem>

							<DropdownDivider />

							<form method="post" action="/?/logout" use:enhance>
								<DropdownItem type="submit">
									<ArrowRightToBracketOutline />
									<span> Log out </span>
								</DropdownItem>
							</form>
						</svelte:fragment>
					</Dropdown>

					<button on:click={() => ($sidebarStateStore = false)} class="btn btn-sm p-1">
						<ChevronDoubleLeftOutline size="sm" />
					</button>
				</div>

				<SidebarItem label="Home" href="/" active={activeUrl === '/'}>
					<svelte:fragment slot="icon">
						<HomeOutline />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Quick Search" active={activeUrl === '/templates'}>
					<svelte:fragment slot="icon">
						<SearchOutline />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Templates" active={activeUrl === '/templates'}>
					<svelte:fragment slot="icon">
						<DnaOutline />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem
					label="All Collections"
					href="/collections"
					active={activeUrl === '/collections'}
				>
					<svelte:fragment slot="icon">
						<DatabaseOutline />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="New collection" on:click={() => (createCollectionModal = true)}>
					<svelte:fragment slot="icon">
						<CirclePlusOutline />
					</svelte:fragment>
				</SidebarItem>
			</div>

			<div>
				<span class="text-sm font-semibold px-1"> Favourites </span>
				{#each favourites as collection}
					<SidebarCollection {collection} active={activeCollection(collection.id)} />
				{/each}
			</div>

			<div class="grow overflow-y-auto">
				<span class="flex justify-between items-center pr-2">
					<span class="text-sm font-semibold px-1"> Personal </span>

					<IconBtn on:click={() => (createCollectionModal = true)} tootipText="Create collection">
						<PlusOutline size="xs" />
					</IconBtn>
				</span>
				<div class="space-y-0.5">
					{#each data.collections as collection}
						<SidebarCollection {collection} active={activeCollection(collection.id)} />
					{/each}
				</div>
			</div>
		</div>
	</Sidebar>

	<div class="w-full flex space-x-1 m-1 relative">
		<slot />
	</div>
</div>

<Modal
	title="New collection"
	open={createCollectionModal}
	onClose={() => (createCollectionModal = false)}
>
	<form on:submit|preventDefault={handleSubmit} class="flex flex-col space-y-2">
		<label class="label flex flex-col items-start space-y-2">
			<span class="label-text">Name</span>
			<input
				type="text"
				name="name"
				placeholder="Tasks"
				required
				class="input input-sm input-ghost bg-gray-200"
			/>
		</label>

		<button type="submit" class="w-ful btn btn-sm btn-primary">Create</button>
	</form>
</Modal>
