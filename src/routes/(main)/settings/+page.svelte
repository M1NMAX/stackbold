<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<div class="grow m-2 p-2 rounded-md bg-gray-50">
	<div class="h-full flex flex-col justify-between p-1 overflow-hidden">
		<h1 class="font-semibold text-2xl">Settings</h1>
		<div>
			<button
				class="btn text-blue-500 dark:text-red-500"
				data-toggle-theme="dark,light"
				data-act-class="ACTIVECLASS">Theme</button
			>
		</div>

		<div>
			<form method="post" action="?/logout" use:enhance>
				<Button type="submit">Log out</Button>
			</form>
		</div>
	</div>
</div>
