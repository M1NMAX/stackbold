<script lang="ts">
	import type { Collection } from '@prisma/client';
	import { Folder } from 'lucide-svelte';

	export let collection: Collection;
	export let active: boolean;
</script>

<span
	class={`${
		active && ' border-r-2 border-primary bg-gray-300 dark:bg-gray-600'
	} flex items-center space-x-2.5 py-0.5 px-1.5  hover:bg-gray-300
 dark:hover:bg-gray-500 transition duration-75 dark:text-gray-400`}
>
	<a href={`/collections/${collection.id}`} class="grow flex items-center space-x-1.5">
		<Folder />
		<span class="trucante font-semibold">{collection.name}</span>
	</a>
</span>
