<script lang="ts">
	import type { PageData } from './$types';
	import { PageContent } from '$lib/components/page';
	import { Items } from '$lib/components/items';

	export let data: PageData;
	$: ({ user, collections, items } = data);

	let view = 'list';
</script>

<svelte:head>
	<title>Dashboard - Stackbold</title>
</svelte:head>
<div class="grow p-1 rounded-md bg-card text-secondary-foreground">
	<PageContent>
		<h1 class="font-semibold text-2xl">Welcome back!</h1>

		<div class="space-y-2">
			{#each collections as collection (collection.id)}
				<div>
					<div>
						<h2>{collection.name}</h2>
					</div>
					<Items
						items={items[collection.id]}
						bind:view
						properties={collection.properties}
						onClickNewItemBtn={() => {}}
					/>
				</div>
			{/each}
		</div>
	</PageContent>
</div>
