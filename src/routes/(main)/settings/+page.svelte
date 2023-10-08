<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Card, DarkMode } from 'flowbite-svelte';
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<h1 class="text-2xl">Settings</h1>

<Card>
	<h2 class="text-lg">Theme</h2>
	<DarkMode />
</Card>

<Card>
	<form method="post" action="?/logout" use:enhance>
		<Button type="submit">Log out</Button>
	</form>
</Card>
