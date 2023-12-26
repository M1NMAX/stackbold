<script lang="ts">
	import { LayoutDashboard } from 'lucide-svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<svelte:head>
	<title>Admin - Stackbold</title>
</svelte:head>

<div class="grow rounded-md bg-card text-secondary-foreground overflow-hidden">
	<div class="h-full w-full mx-auto p-2 lg:p-8 space-y-2 overflow-y-auto">
		<div class="flex items-center space-x-2">
			<LayoutDashboard class="icon-lg" />
			<h1 class="font-semibold text-3xl">Admin Dashboard</h1>
		</div>
	</div>
</div>
