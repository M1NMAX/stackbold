<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.collection.name}</title>
</svelte:head>

<div>
	<div>
		{data.collection.id}
		{data.collection.name}
		{data.collection.ownerId}
	</div>
</div>
