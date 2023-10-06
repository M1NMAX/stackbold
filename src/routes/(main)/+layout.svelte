<script lang="ts">
	import {
		Sidebar,
		SidebarWrapper,
		SidebarBrand,
		SidebarItem,
		SidebarGroup
	} from 'flowbite-svelte';
	import { ClockOutline, CogOutline, FolderOutline, HomeOutline } from 'flowbite-svelte-icons';
	import type { LayoutData } from './$types';

	let spanClass = 'flex-1 ml-3 whitespace-nowrap';

	let site = {
		name: 'Username',
		href: '/collecitons',
		img: './favicon.png'
	};

	export let data: LayoutData;

	$: favourites = data.collections.filter((collection) => collection.isFavourite);
</script>

<div class=" h-screen flex">
	<Sidebar>
		<SidebarWrapper class="h-full">
			<SidebarGroup>
				<SidebarBrand {site} />
				<SidebarItem label="Home" href="/collections">
					<svelte:fragment slot="icon">
						<HomeOutline
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Recent" {spanClass}>
					<svelte:fragment slot="icon">
						<ClockOutline
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

	<slot />
</div>
