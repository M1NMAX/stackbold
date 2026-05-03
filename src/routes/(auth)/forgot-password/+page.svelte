<script lang="ts">
	import { Button, Field, Label } from '$lib/components/base/index.js';
	import { untrack } from 'svelte';
	import { getToastState } from '$lib/states/index.js';
	import { useSuperForm } from '$lib/utils/index.js';

	let { data } = $props();

	const toastState = getToastState();
	const { form, errors, enhance } = useSuperForm(
		untrack(() => data.form),
		toastState
	);
</script>

<div class="auth-form-container">
	<h1>Forgot your password</h1>

	<form method="post" use:enhance>
		<Field errors={$errors.email}>
			<Label for="email" name="Email" />
			<input
				id="email"
				type="text"
				name="email"
				required
				bind:value={$form.email}
				class="input ghost"
			/>
		</Field>
		<Button type="submit" class="w-full">Reset password</Button>
	</form>
</div>
<div class="form-link-container">
	<a href="/signin" class="link"> Back to Sign in </a>
</div>
