<script lang="ts">
	import { Input, Label, Helper, Button, Checkbox, A, Alert } from 'flowbite-svelte';
	import { enhance } from '$app/forms';

	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<h1>Sign in</h1>
<form method="post" use:enhance>
	<div class="grid gap-6 mb-6">
		<div>
			<Label for="username" class="mb-2">Username</Label>
			<Input type="text" id="username" placeholder="John" required />
		</div>

		<div class="mb-6">
			<Label for="password" class="mb-2">Password</Label>
			<Input type="password" id="password" placeholder="•••••••••" required />
		</div>
		<Button type="submit">Submit</Button>
	</div>
</form>
{#if form?.message}
	<Alert>{form.message}</Alert>
{/if}

<Button href="/signup" color="yellow">Create an account</Button>
