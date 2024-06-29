<script lang="ts">
	import type { PageData } from './$types';
	import logoSrc from '$lib/assets/logo.png';
	import { superForm } from 'sveltekit-superforms/client';
	import { Button } from '$lib/components/ui/button';

	export let data: PageData;

	const { form, message, errors, enhance } = superForm(data.form);
</script>

<div>
	<div class="flex justify-center pb-8">
		<img src={logoSrc} alt="logo" />
	</div>

	<h1 class="mb-6 text-center text-3xl font-medium">Email Validation</h1>

	{#if $message}
		<div class="msg-error">
			{$message}
		</div>
	{/if}

	<form method="post" use:enhance class="space-y-4">
		<div>
			<label for="code" class="label px-0"> Code </label>
			<input
				id="code"
				type="text"
				name="code"
				required
				bind:value={$form.code}
				class="input input-bordered"
			/>

			{#if $errors.code}
				<span class="text-error"> {$errors.code} </span>
			{/if}
		</div>
		<div>
			<Button type="submit" class="w-full">Validate</Button>
		</div>
	</form>
</div>
<div class="my-8 leading-8 font-medium text-sm">
	<p class="text-center text-gray-500">
		<a href="/signup" class="no-underline text-primary hover:text-primary/70"> Back to Sign up </a>
	</p>
</div>
