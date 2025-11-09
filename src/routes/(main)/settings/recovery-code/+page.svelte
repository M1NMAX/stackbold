<script lang="ts">
	import Copy from 'lucide-svelte/icons/copy';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { Breadcrumb, BreadcrumbItem, Button } from '$lib/components/base/index.js';
	import { PageContent, PageHeader } from '$lib/components/page/index.js';
	import { browser } from '$app/environment';
	import { getToastState } from '$lib/states/index.js';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';

	let { data } = $props();
	let isLoading = $state(false);

	const toastState = getToastState();

	async function handleEnhanceResult(result: ActionResult) {
		stopLoading();
		if (result.type !== 'success') {
			toastState.error();
			return;
		}
		await invalidateAll();
	}

	function copyToClipboard() {
		if (!browser) return;
		navigator.clipboard.writeText(data.recoveryCode);
	}

	function startLoading() {
		isLoading = true;
		toastState.loading();
	}

	function stopLoading() {
		isLoading = false;
		toastState.clear();
	}
</script>

<svelte:head>
	<title>Recovery code - Stackbold</title>
</svelte:head>
<PageHeader>
	<Button theme="secondary" variant="icon" class="lg:hidden" onclick={() => history.back()}>
		<ChevronLeft />
	</Button>
	<Breadcrumb class="hidden lg:flex">
		<BreadcrumbItem icon="settings" name="Settings" link="/settings" />
		<BreadcrumbItem icon="security" name="Recovery code" last />
	</Breadcrumb>
</PageHeader>

<PageContent class="justify-center items-center">
	<h1 class="form-title">Recovery code</h1>

	<p class="text-center">
		You can use this recovery code if you lose access to your second factors.
	</p>

	<div class="form-container space-y-4">
		<div class="flex items-center justify-between p-2 rounded-md bg-secondary">
			<p class="grow">{data.recoveryCode}</p>
			<Button variant="icon" theme="outline" disabled={isLoading} onclick={() => copyToClipboard()}>
				<Copy />
			</Button>
		</div>

		<form
			method="post"
			use:enhance={() => {
				startLoading();
				return async ({ result }) => handleEnhanceResult(result);
			}}
		>
			<Button type="submit" class="w-full" disabled={isLoading}>Generate new code</Button>
		</form>
	</div>
</PageContent>
