<script lang="ts">
	import { Button, Field, Label } from '$lib/components/base/index.js';
	import { getToastState } from '$lib/states/index.js';
	import { useSuperForm } from '$lib/utils/index.js';
	import { untrack } from 'svelte';

	let { data } = $props();

	const toastState = getToastState();
	const { form, errors, enhance } = useSuperForm(
		untrack(() => data.form),
		toastState
	);
</script>

<div class="auth-form-container">
	<h1>Two-factor authentication</h1>
	<p>Enter the code from your authenticator app.</p>

	<form method="post" use:enhance>
		<Field errors={$errors.code}>
			<Label for="code" name="Code" />
			<input
				id="code"
				type="text"
				name="code"
				required
				bind:value={$form.code}
				class="input input-ghost"
				autocomplete="one-time-code"
			/>
		</Field>
		<Button type="submit" class="w-full">Verify</Button>
	</form>
</div>

<div class="form-link-container">
	<a class="link" href="/reset-password/2fa/recovery-code"> Use recovery code instead </a>
</div>
