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
	<h1>Email Verification</h1>
	<p>We sent an 8-digit code to your email address</p>
	<form method="post" use:enhance action="?/verify">
		<Field errors={$errors.code}>
			<Label for="code" name="Code" />
			<input
				id="code"
				type="text"
				name="code"
				required
				bind:value={$form.code}
				class="input input-ghost"
			/>
		</Field>
		<Button type="submit" class="w-full">Verify</Button>
	</form>

	<form method="post" use:enhance action="?/resend" class="mt-5">
		<Button type="submit" theme="secondary" class="w-full">Resend</Button>
	</form>
</div>
