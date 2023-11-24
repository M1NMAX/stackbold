<script lang="ts">
	import { getContext } from 'svelte';

	import type { Writable } from 'svelte/store';
	import type { PageData } from './$types';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Menu } from 'lucide-svelte';

	export let data: PageData;

	const sidebarState = getContext<Writable<boolean>>('sidebarStateStore');
</script>

<div class="grow p-1 rounded-md bg-card text-secondary-foreground">
	<div class="flex items-center space-x-1.5">
		{#if !$sidebarState}
			<Button on:click={() => ($sidebarState = true)} class="btn btn-sm mr-1.5">
				<Menu />
			</Button>
		{/if}
		<h1 class=" font-semibold text-2xl">Home</h1>
	</div>
	<h1>Home</h1>
	<p>User id: {data.user.userId}</p>
	<p>Username: {data.user.name}</p>

	<a href="/collections" class="btn btn-sm btn-primary">Collections</a>
</div>
