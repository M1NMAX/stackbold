<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { Breadcrumb, BreadcrumbItem, Button, Field, Label } from '$lib/components/base/index.js';
	import { PageContent, PageHeader } from '$lib/components/page/index.js';
	import { getToastState } from '$lib/states/index.js';
	import { superForm } from 'sveltekit-superforms/client';

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

<svelte:head>
	<title>Change Password - Stackbold</title>
</svelte:head>
<PageHeader>
	<Button theme="secondary" variant="icon" class="lg:hidden" onclick={() => history.back()}>
		<ChevronLeft />
	</Button>
	<Breadcrumb class="hidden lg:flex">
		<BreadcrumbItem icon="settings" name="Settings" link="/settings" />
		<BreadcrumbItem icon="security" name="Change password" last />
	</Breadcrumb>
</PageHeader>

<PageContent class="justify-center items-center">
	<h1 class="form-title mb-6">Change password</h1>
	<form method="post" use:enhance class="form-container">
		<Field class="py-1" errors={$errors.currentPassword}>
			<Label for="currentPassword" name="Current password" />
			<input
				required
				id="currentPassword"
				type="password"
				name="currentPassword"
				class="input input-ghost"
				bind:value={$form.currentPassword}
			/>
		</Field>

		<Field class="py-1" errors={$errors.newPassword}>
			<Label for="newPassword" name="New password" />
			<input
				required
				id="newPassword"
				type="password"
				name="newPassword"
				class="input input-ghost"
				bind:value={$form.newPassword}
			/>
		</Field>

		<Button type="submit" class="w-full">Save</Button>
	</form>
</PageContent>
