<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import { PageContent } from '$lib/components/page';
</script>

<div class="grow p-1 rounded-md bg-card text-secondary-foreground">
	<PageContent>
		<div class="flex items-center space-x-2">
			<Trash2 class="icon-lg" />
			<h1 class="font-semibold text-3xl">Trash</h1>
		</div>
		<!-- TODO: create page description -->
		<p>Page description</p>
	</PageContent>
</div>
