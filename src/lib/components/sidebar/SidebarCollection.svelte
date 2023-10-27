<script lang="ts">
	import type { Collection } from '@prisma/client';
	import { FolderOutline } from 'flowbite-svelte-icons';

	export let collection: Collection;
	export let active: boolean;
</script>

<span
	class={`${
		active && 'rounded-l-md border-r-2 border-primary-500 bg-gray-300 dark:bg-gray-600'
	} flex items-center space-x-4 p-1.5 hover:rounded-l-md hover:bg-gray-300
 dark:hover:bg-gray-500 transition duration-75 dark:text-gray-400`}
>
	<a href={`/collections/${collection.id}`} class="grow flex items-center space-x-1.5">
		<FolderOutline />
		<span class="trucante font-semibold">{collection.name}</span>
	</a>
</span>
