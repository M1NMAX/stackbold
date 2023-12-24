<script lang="ts">
	import type { PageData } from './$types';
	import { PageContent } from '$lib/components/page';
	import { Button } from '$lib/components/ui/button';
	import { Items } from '$lib/components';

	export let data: PageData;
	$: ({ user, collections, items } = data);

	let currView = 'list';
</script>

<svelte:head>
	<title>Dashboard - Stackbold</title>
</svelte:head>
<div class="grow p-1 rounded-md bg-card text-secondary-foreground">
	<!-- <pre>
		{JSON.stringify(items[collections[0].id], null, 2)}
	</pre> -->
	<PageContent>
		<h1 class="font-semibold text-2xl">Welcome back!, {user.name}</h1>

		<div class="space-y-2">
			{#each collections as collection (collection.id)}
				<div>
					<div>{collection.name}</div>
					<Items
						currActiveItemId={undefined}
						items={items[collection.id]}
						bind:view={currView}
						collectionProperties={collection.properties}
						onClickNewItemBtn={() => {}}
					/>
				</div>
			{/each}
		</div>
	</PageContent>
</div>
