<script lang="ts">
	import { Button, Card, Search } from 'flowbite-svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Collections * Stackbold</title>
</svelte:head>

<div class="flex flex-col space-y-4">
	<Search>
		<Button>Search</Button>
	</Search>
	{#each data.collections as collection}
		<Card href={`/collections/${collection.id}`}>
			<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
				{collection.name}
			</h5>
			<p class="font-normal text-gray-700 dark:text-gray-400 leading-tight">
				{collection.description}
			</p>
		</Card>
	{/each}
</div>
