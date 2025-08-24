<script lang="ts">
	import { page } from '$app/state';
	import { PageContainer, PageContent, PageHeader } from '$lib/components/page/index.js';
</script>

<svelte:head>
	<title>Error - Stackbold</title>
</svelte:head>
<PageContainer>
	<PageContent class="flex flex-col items-center justify-center">
		<h1 class="text-3xl font-semibold">{page.status}</h1>
		{#if page.error}
			<p class="text-xl">{page.error.message}</p>
		{/if}
	</PageContent>
</PageContainer>
