<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button, Field, Label } from '$lib/components/base/index.js';

	let { data } = $props();

	const { form, errors, enhance } = superForm(data.form);
</script>

<div>
	<h1 class="form-title mb-6">Forgot your password</h1>

	<form method="post" use:enhance>
		<Field class="py-1" errors={$errors.email}>
			<Label for="email" name="Email" />
			<input
				id="email"
				type="text"
				name="email"
				required
				bind:value={$form.email}
				class="input input-ghost"
			/>
		</Field>
		<Button type="submit" class="w-full">Reset password</Button>
	</form>
</div>
<div class="form-link-container">
	<a href="/signin" class="link"> Back to Sign in </a>
</div>
