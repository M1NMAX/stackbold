<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { Button, Field, Label } from '$lib/components/base/index.js';
	import { PageContainer, PageContent, PageHeader, PageTitle } from '$lib/components/page/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';
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

	let isSmHeadingVisible = $state(false);
	function handleScroll(e: Event) {
		const targetEl = e.target as HTMLDivElement;

		if (targetEl.scrollTop > 0) isSmHeadingVisible = true;
		else isSmHeadingVisible = false;
	}
</script>

<svelte:head>
	<title>2fa Setup - Stackbold</title>
</svelte:head>
<PageContainer>
	<PageHeader>
		<SidebarOpenBtn />
		<Button theme="secondary" variant="icon" class="lg:hidden" onclick={() => history.back()}>
			<ChevronLeft />
		</Button>
		<PageTitle
			icon="settings"
			title="Settings"
			small
			class={isSmHeadingVisible ? 'grow' : 'hidden'}
		/>
	</PageHeader>

	<PageContent onscroll={handleScroll}>
		<PageTitle icon="settings" title="Settings" />

		<form method="post" use:enhance>
			<Field class="py-1" errors={$errors.email}>
				<Label for="email" name="New email" />
				<input
					required
					id="email"
					type="text"
					name="email"
					class="input input-ghost"
					bind:value={$form.email}
				/>
			</Field>

			<Button type="submit" class="w-full">Save</Button>
		</form>
	</PageContent>
</PageContainer>
