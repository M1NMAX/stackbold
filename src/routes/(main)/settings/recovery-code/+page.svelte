<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import { Button } from '$lib/components/base/index.js';
	import { PageContainer, PageContent, PageHeader, PageTitle } from '$lib/components/page/index.js';
	import { SidebarOpenBtn } from '$lib/components/sidebar/index.js';

	let { data } = $props();

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

		<section class="flex p-2 rounded-sm bg-secondary">
			<div class="grow">
				<h3 class="text-base font-semibold">Recovery code</h3>
				<p>Your recovery code is: {data.recoveryCode}</p>
				<p>You can use this recovery code if you lose access to your second factors.</p>
			</div>
		</section>
	</PageContent>
</PageContainer>
