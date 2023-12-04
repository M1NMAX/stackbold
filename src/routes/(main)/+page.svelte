<script lang="ts">
	import type { PageData } from './$types';
	import { PageHeader } from '$lib/components';
	import { Button } from '$lib/components/ui/button';
	import { redirectToast, successToast } from '$lib/components/feedback';

	export let data: PageData;
</script>

<div class="grow p-1 rounded-md bg-card text-secondary-foreground">
	<PageHeader>
		<h1 class="font-semibold text-2xl">Home</h1>
	</PageHeader>

	<p>User id: {data.user.userId}</p>
	<p>Username: {data.user.name}</p>

	<Button
		on:click={() => {
			successToast('JEHEH');
		}}
	>
		heloe
	</Button>

	<Button
		on:click={() => {
			redirectToast('JEHEH', '/collections/');
		}}
	>
		heloe
	</Button>
	<a href="/collections" class="btn btn-sm btn-primary">Collections</a>
</div>
