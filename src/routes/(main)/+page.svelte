<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from 'flowbite-svelte';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1>Profile</h1>
<p>User id: {data.user.userId}</p>
<p>Username: {data.user.name}</p>
<form method="post" action="?/logout" use:enhance>
	<input type="submit" value="Sign out" />
</form>

<Button href="/collections">Collections</Button>