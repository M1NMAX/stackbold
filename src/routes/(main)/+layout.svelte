<script lang="ts">
	import {
		Sidebar,
		SidebarWrapper,
		SidebarItem,
		SidebarGroup,
		Badge,
		Avatar
	} from 'flowbite-svelte';
	import { CogOutline, DnaOutline, FolderOutline, HomeOutline } from 'flowbite-svelte-icons';
	import type { LayoutData } from './$types';

	let spanClass = 'flex-1 ml-3 whitespace-nowrap';

	export let data: LayoutData;

	$: favourites = data.collections.filter((collection) => collection.isFavourite);
</script>

<div class=" h-screen flex">
	<Sidebar>
		<SidebarWrapper class="h-full">
			<SidebarGroup>
				<div class="flex justify-between space-x-4">
					<Avatar src="./favicon.png" class="h-8 w-8" />
					<span class="text-xl font-semibold"> {data.user.name} </span>
					<Badge rounded color="blue" class="font-bold uppercase">Admin</Badge>
				</div>

				<SidebarItem label="Home" href="/">
					<svelte:fragment slot="icon">
						<HomeOutline
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Templates" {spanClass}>
					<svelte:fragment slot="icon">
						<DnaOutline
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Settings" {spanClass}>
					<svelte:fragment slot="icon">
						<CogOutline
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
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
					<span class="flex space-x-4">
						<FolderOutline />

						<a href={`/collections/${collection.id}`}>
							{collection.name}
						</a>
					</span>
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
					<span class="flex space-x-4">
						<FolderOutline />

						<a href={`/collections/${collection.id}`}>
							{collection.name}
						</a>
					</span>
				{/each}
			</SidebarGroup>
		</SidebarWrapper>
	</Sidebar>

	<div>
		<slot />
	</div>
</div>
