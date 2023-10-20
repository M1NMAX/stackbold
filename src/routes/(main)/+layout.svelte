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
		Input,
		Checkbox
	} from 'flowbite-svelte';
	import {
		CogOutline,
		DnaOutline,
		HomeOutline,
		PlusOutline,
		SearchOutline
	} from 'flowbite-svelte-icons';

	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { SidebarCollection, SidebarItem } from '$lib/components';

	export let data: LayoutData;

	$: favourites = data.collections.filter((collection) => collection.isFavourite);

	$: activeUrl = $page.url.pathname;
	$: activeCollection = (id: string) => $page.url.pathname === `/collections/${id}`;

	let createCollectionModal = false;

	const handleSubmit = (e: { currentTarget: HTMLFormElement }) => {
		const formData = new FormData(e.currentTarget);

		console.log(formData);
	};
</script>

<div class=" h-screen flex bg-gray-200">
	<Sidebar class="w-1/6">
		<SidebarWrapper class="h-full pr-0 rounded-none bg-gray-200">
			<SidebarGroup>
				<div class="flex justify-between space-x-4">
					<Avatar src="./favicon.png" class="h-8 w-8" />
					<span class="text-xl font-semibold"> {data.user.name} </span>
					<Badge color="blue" class="font-bold uppercase">Admin</Badge>
				</div>

				<div class="py-1 pr-2 pl-1">
					<button class="w-full flex items-center space-x-4 p-1.5 rounded-md bg-gray-300">
						<SearchOutline class="icon-xss" />
						<span class="font-semibold"> Search </span>
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

				<SidebarItem label="Settings" href="/settings" active={activeUrl === '/settings'}>
					<svelte:fragment slot="icon">
						<CogOutline class="icon-sm" />
					</svelte:fragment>
				</SidebarItem>
			</SidebarGroup>

			<SidebarGroup class="mt-8">
				<span class="flex justify-between">
					<span> Favourites </span>

					<span>
						{favourites.length}
					</span>
				</span>
				{#each favourites as collection}
					<SidebarCollection {collection} active={activeCollection(collection.id)} />
				{/each}
			</SidebarGroup>

			<SidebarGroup class="mt-8">
				<span class="flex justify-between">
					<span> Collections </span>
					<span>
						{data.collections.length}
					</span>
				</span>
				{#each data.collections as collection}
					<SidebarCollection {collection} active={activeCollection(collection.id)} />
				{/each}
			</SidebarGroup>

			<div class="py-1 pr-2 pl-1">
				<Button
					on:click={() => (createCollectionModal = true)}
					class="w-full flex items-center space-x-4 p-1.5 rounded-md"
				>
					<PlusOutline class="icon-xss" />
					<span class="font-semibold"> Create Collection </span>
				</Button>
			</div>
		</SidebarWrapper>
	</Sidebar>

	<slot />
</div>

<Modal bind:open={createCollectionModal} size="xs" autoclose={false} class="w-full">
	<form method="POST" action="/collections?/createCollection" class="flex flex-col space-y-6">
		<h3 class="mb-2 text-xl font-medium text-gray-900 dark:text-white">New collection</h3>
		<Label class="space-y-2">
			<span>Name</span>
			<Input type="text" name="name" placeholder="Tasks" required />
		</Label>

		<Button type="submit" class="w-full">Create</Button>
	</form>
</Modal>
