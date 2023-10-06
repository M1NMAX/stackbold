<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Collections * Stackbold</title>
</svelte:head>

<div>
	{#each data.collections as collection}
		<div>
			{collection.id}
			{collection.name}
			{collection.ownerId}
		</div>
	{/each}
</div>
