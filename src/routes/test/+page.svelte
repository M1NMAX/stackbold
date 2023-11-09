<script lang="ts">
	import { Sidebar } from '$lib/components';

	const hje = 'hehehhh';

	let isSiderOpen = true;

	const handleSidebarState = () => {
		isSiderOpen = !isSiderOpen;
	};
</script>

<div class="h-screen flex">
	<Sidebar
		class={`${isSiderOpen ? 'w-64' : 'w-0'} transition-all bg-gray-50 rounded dark:bg-gray-800`}
	>
		<button class="btn btn-sm"> hrrh </button>
		<button class="btn btn-sm"> hrrh </button>
	</Sidebar>

	{hje}

	<button on:click={handleSidebarState} class="btn btn-primary btn-sm"> Side </button>
</div>
