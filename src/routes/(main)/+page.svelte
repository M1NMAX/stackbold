<script lang="ts">
	import type { PageData } from './$types';
	import { PageHeader } from '$lib/components';

	export let data: PageData;
</script>

<div class="grow p-1 rounded-md bg-card text-secondary-foreground">
	<PageHeader>
		<h1 class="font-semibold text-2xl">Home</h1>
	</PageHeader>

	<p>User id: {data.user.userId}</p>
	<p>Username: {data.user.name}</p>

	<a href="/collections" class="btn btn-sm btn-primary">Collections</a>
</div>
