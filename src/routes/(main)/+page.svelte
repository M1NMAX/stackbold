<script lang="ts">
	import { BarsOutline } from 'flowbite-svelte-icons';
	import type { PageData } from './$types';
	import { getContext } from 'svelte';
	import IconBtn from '$lib/components/IconBtn.svelte';

	export let data: PageData;

	const sidebarState = getContext('sidebarStateStore') as {
		update: (callback: () => boolean) => void;
	};
</script>

<div class="grow p-1 rounded-md bg-gray-50">
	<div class="flex items-center space-x-2">
		<IconBtn
			on:click={() => {
				sidebarState.update(() => true);
			}}
			class="btn btn-sm "
		>
			<BarsOutline size="sm" />
		</IconBtn>
		<h1 class=" font-semibold text-2xl">Home</h1>
	</div>
	<h1>Home</h1>
	<p>User id: {data.user.userId}</p>
	<p>Username: {data.user.name}</p>

	<a href="/collections" class="btn btn-sm btn-primary">Collections</a>
</div>
