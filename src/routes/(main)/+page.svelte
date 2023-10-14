<script lang="ts">
	import { Button } from 'flowbite-svelte';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="grow m-1.5 ml-0 p-1 rounded-md bg-gray-50">
	<h1>Home</h1>
	<p>User id: {data.user.userId}</p>
	<p>Username: {data.user.name}</p>

	<Button href="/collections">Collections</Button>
</div>
