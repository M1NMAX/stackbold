<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { FolderOutline } from 'flowbite-svelte-icons';
	import { getContext } from 'svelte';

	export let data: PageData;

	const sidebarState = getContext('sidebarStateStore') as {
		update: (callback: () => boolean) => void;
	};
</script>

<svelte:head>
	<title>Collections * Stackbold</title>
</svelte:head>

<div class="w-full rounded bg-gray-50 flex flex-col justify-between p-1 overflow-hidden">
	<h1 class=" font-semibold text-2xl">My Collections</h1>

	<button
		on:click={() => {
			sidebarState.update(() => true);
		}}
		class="btn btn-sm btn-primary"
	>
		gmgm
	</button>
	<div class="grow flex flex-col space-y-2 overflow-y-auto">
		{#each data.collections as collection}
			<div class="flex flex-col rounded bg-gray-100 py-1 px-2">
				<div class="flex items-center justify-between space-x-2">
					<FolderOutline class="w-4 h-4" />
					<h5 class="grow mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
						{collection.name}
					</h5>
					<Button
						on:click={() => goto(`/collections/${collection.id}`)}
						class="bg-gray-50 hover:bg-gray-100 font-semibold text-black px-2 py-1">Open</Button
					>
				</div>

				<p class="font-normal text-gray-700 dark:text-gray-400 leading-tight">
					{collection.description}
				</p>
			</div>
		{/each}
	</div>
</div>
