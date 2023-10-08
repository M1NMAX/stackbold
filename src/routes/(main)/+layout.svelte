<script lang="ts">
	import { Sidebar, SidebarWrapper, SidebarGroup, Badge, Avatar } from 'flowbite-svelte';
	import { CogOutline, DnaOutline, HomeOutline } from 'flowbite-svelte-icons';

	import SidebarCollection from '$lib/components/SidebarCollection.svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import SidebarItem from '$lib/components/SidebarItem.svelte';

	export let data: LayoutData;

	$: favourites = data.collections.filter((collection) => collection.isFavourite);

	$: activeUrl = $page.url.pathname;
	$: activeCollection = (id: string) => $page.url.pathname === `/collections/${id}`;
</script>

<div class=" h-screen flex">
	<Sidebar>
		<SidebarWrapper class="h-full pr-0">
			<SidebarGroup>
				<div class="flex justify-between space-x-4">
					<Avatar src="./favicon.png" class="h-8 w-8" />
					<span class="text-xl font-semibold"> {data.user.name} </span>
					<Badge rounded color="blue" class="font-bold uppercase">Admin</Badge>
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
		</SidebarWrapper>
	</Sidebar>

	<div class="m-1 border">
		<slot />
	</div>
</div>
