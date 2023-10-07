<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Alert, Button, Helper, Input, Label } from 'flowbite-svelte';

	import type { PageData } from './$types';

	export let data: PageData;

	const { form, message, errors, enhance } = superForm(data.form);
</script>

<h1>Reset password</h1>

{#if $message}
	<Alert>{$message}</Alert>
{/if}

<form method="post" use:enhance>
	<div class="grid gap-6 mb-6">
		<div>
			<Label for="password" class="mb-2">New password</Label>
			<Input
				type="password"
				id="password"
				name="password"
				placeholder="•••••••••"
				required
				bind:value={$form.password}
			/>
			{#if $errors.password}
				<Helper class="mt-2" color="red">
					{$errors.password}
				</Helper>
			{/if}
		</div>

		<Button type="submit">Submit</Button>
	</div>
</form>
