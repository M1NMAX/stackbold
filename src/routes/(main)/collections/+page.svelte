<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	import { Folder } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { PageContent } from '$lib/components/page';
	import { SidebarButton } from '$lib/components/sidebar';

	export let data: PageData;
</script>

<svelte:head>
	<title>Collections * Stackbold</title>
</svelte:head>

<div
	class="w-full flex flex-col justify-between p-1 overflow-hidden rounded bg-card text-secondary-foreground"
>
	<PageContent>
		<SidebarButton />

		<h1 class="font-semibold text-3xl">All Collections</h1>

		<div class="grow flex flex-col space-y-2 overflow-y-auto">
			{#each data.collections as collection}
				<div class="flex flex-col py-1 px-2 rounded bg-secondary/40 text-secondary-foreground">
					<div class="flex items-center justify-between space-x-2">
						<Folder />
						<h5 class="grow mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
							{collection.name}
						</h5>
						<Button variant="outline" on:click={() => goto(`/collections/${collection.id}`)}>
							Open
						</Button>
					</div>

					<p class="font-normal text-gray-700 dark:text-gray-400 leading-tight">
						{collection.description}
					</p>
				</div>
			{/each}
		</div>
	</PageContent>
</div>
