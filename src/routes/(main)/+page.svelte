<script lang="ts">
	import { BarsOutline } from 'flowbite-svelte-icons';
	import { getContext } from 'svelte';
	import IconBtn from '$lib/components/IconBtn.svelte';
	import type { Writable } from 'svelte/store';
	import type { PageData } from './$types';

	export let data: PageData;

	const sidebarState = getContext<Writable<boolean>>('sidebarStateStore');
</script>

<div class="grow p-1 rounded-md bg-gray-50">
	<div class="flex items-center space-x-1.5">
		{#if !$sidebarState}
			<IconBtn on:click={() => ($sidebarState = true)} class="btn btn-sm mr-1.5">
				<BarsOutline size="sm" />
			</IconBtn>
		{/if}
		<h1 class=" font-semibold text-2xl">Home</h1>
	</div>
	<h1>Home</h1>
	<p>User id: {data.user.userId}</p>
	<p>Username: {data.user.name}</p>

	<a href="/collections" class="btn btn-sm btn-primary">Collections</a>
</div>
