<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Input, Label } from 'flowbite-svelte';

	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h1>Sign up</h1>
<form method="post" use:enhance>
	<div class="grid gap-6 mb-6">
		<div>
			<Label for="username" class="mb-2">Username</Label>
			<Input type="text" id="username" name="username" placeholder="John" required />
		</div>

		<div class="mb-6">
			<Label for="password" class="mb-2">Password</Label>
			<Input type="password" id="password" name="password" placeholder="•••••••••" required />
		</div>
		<Button type="submit">Submit</Button>
	</div>
</form>
{#if form?.message}
	<Alert class="error">{form.message}</Alert>
{/if}
<Button href="/login" color="yellow">Sign in</Button>
