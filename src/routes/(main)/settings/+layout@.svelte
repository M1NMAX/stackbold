<script lang="ts">
	import { PageContainer } from '$lib/components/page/index.js';

	let { children } = $props();
</script>

<PageContainer class="h-dvh">
	{@render children()}
</PageContainer>
