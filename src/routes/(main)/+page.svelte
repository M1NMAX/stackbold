<script lang="ts">
	import type { PageData } from './$types';
	import { PageHeader } from '$lib/components';
	import { Button } from '$lib/components/ui/button';

	export let data: PageData;
</script>

<svelte:head>
	<title>Dashboard - Stackbold</title>
</svelte:head>
<div class="grow p-1 rounded-md bg-card text-secondary-foreground">
	<PageHeader>
		<h1 class="font-semibold text-2xl">Welcome back!</h1>
	</PageHeader>

	<p>User id: {data.user.userId}</p>
	<p>Username: {data.user.name}</p>

	<Button href="/collections">Collections</Button>
</div>
