<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button, Field, Label } from '$lib/components/base/index.js';
	import { dev } from '$app/environment';
	import { getToastState } from '$lib/states/toast-state.svelte.js';

	let { data } = $props();

	const toastState = getToastState();
	const { form, errors, enhance } = superForm(data.form, {
		onResult: ({ result }) => {
			if (result.type != 'failure') return;
			if (result.data == null || result.data.form.errors._errors == null) return;
			toastState.error(result.data.form.errors._errors);
		}
	});
</script>

<div>
	<h1 class="text-center text-3xl font-medium">Email Verification</h1>
	<p class="mb-6 text-center font-medium">We sent an 8-digit code to your email address</p>
	<form method="post" use:enhance action="?/verify" class="space-y-4">
		<Field class="py-1" errors={$errors.code}>
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
{#if dev}
	<div class="my-8 leading-8 font-medium text-sm">
		<p class="text-center text-gray-500">
			<a href="/signup" class="no-underline text-primary hover:text-primary/70">
				Back to Sign up
			</a>
		</p>
	</div>
{/if}
