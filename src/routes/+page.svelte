<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from 'flowbite-svelte';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1>Welcome to SvelteKit</h1>
<p class="text-blue-500 text-3xl">
	Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>

<p>
	<a href="/login">Login</a>
</p>

<h1>Profile</h1>
<p>User id: {data.userId}</p>
<p>Username: {data.username}</p>
<form method="post" action="?/logout" use:enhance>
	<input type="submit" value="Sign out" />
</form>

<Button href="/collections">Collections</Button>
