<script lang="ts">
	import type { PageData } from './$types';
	import { PageContent, PageHeader } from '$lib/components/page';
	import { Button } from '$lib/components/ui/button';

	export let data: PageData;
</script>

<svelte:head>
	<title>Dashboard - Stackbold</title>
</svelte:head>
<div class="grow p-1 rounded-md bg-card text-secondary-foreground">
	<PageContent>
		<h1 class="font-semibold text-2xl">Welcome back!</h1>
		<p>User id: {data.user.userId}</p>
		<p>Username: {data.user.name}</p>

		<Button href="/collections">Collections</Button>
	</PageContent>
	<PageHeader />
</div>
