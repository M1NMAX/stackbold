<script lang="ts">
	import {
		ChevronsLeft,
		Database,
		Dna,
		Home,
		LogOut,
		Plus,
		PlusCircle,
		Search,
		Settings
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { Sidebar, SidebarCollection, SidebarItem } from '$lib/components';
	import toast from 'svelte-french-toast';
	import { trpc } from '$lib/trpc/client';
	import { TRPCClientError } from '@trpc/client';
	import { goto, invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { writable } from 'svelte/store';
	import { setContext } from 'svelte';
	import { enhance } from '$app/forms';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';

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
					<DropdownMenu.Root>
						<div class="w-full flex items-center justify-between space-x-1">
							<DropdownMenu.Trigger asChild let:builder>
								<Button builders={[builder]} variant="outline" class="grow">
									<span class="flex justify-start items-center space-x-1.5">
										<img
											src={`https://api.dicebear.com/7.x/shapes/svg?seed=${data.user.name}`}
											class=" rounded-full h-6 w-6"
											alt="avatar"
										/>
										<span class="grow font-semibold">{data.user.name}</span>
									</span>
								</Button>
							</DropdownMenu.Trigger>
							<Button variant="outline" size="icon" on:click={() => ($sidebarStateStore = false)}>
								<ChevronsLeft />
							</Button>
						</div>
						<DropdownMenu.Content class="w-56">
							<DropdownMenu.Label>My Account</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item href="/settings">
									<Settings class="mr-2 h-4 w-4" />
									<span>Settings</span>
								</DropdownMenu.Item>
							</DropdownMenu.Group>

							<DropdownMenu.Separator />

							<form method="post" action="/?/logout" use:enhance>
								<!-- //TODO: add action -->
								<DropdownMenu.Item>
									<LogOut class="mr-2 h-4 w-4" />
									<span>Log out</span>
								</DropdownMenu.Item>
							</form>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>

				<SidebarItem label="Home" href="/" active={activeUrl === '/'}>
					<svelte:fragment slot="icon">
						<Home />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Quick Search" active={activeUrl === '/templates'}>
					<svelte:fragment slot="icon">
						<Search />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Templates" active={activeUrl === '/templates'}>
					<svelte:fragment slot="icon">
						<Dna />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem
					label="All Collections"
					href="/collections"
					active={activeUrl === '/collections'}
				>
					<svelte:fragment slot="icon">
						<Database />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="New collection" on:click={() => (createCollectionModal = true)}>
					<svelte:fragment slot="icon">
						<PlusCircle />
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

					<Button variant="outline" size="icon" on:click={() => (createCollectionModal = true)}>
						<Plus class="w-4 h-4" />
					</Button>
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

<Dialog.Root bind:open={createCollectionModal}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>New collection</Dialog.Title>
		</Dialog.Header>
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

			<!-- //TODO: upd form or change logic  -->
			<Button type="submit" class="w-ful btn btn-sm btn-primary">Create</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
