<script lang="ts">
	import { Button, Label } from 'flowbite-svelte';
	import { DotsVerticalOutline } from 'flowbite-svelte-icons';

	export let id: string;
	export let name: string;
</script>

<div class="grow flex justify-between items-center">
	<Label for={id} class="grow truncate font-semibold">{name}</Label>
	<Button color="alternative" class="p-1 rounded">
		<DotsVerticalOutline class="icon-xxs" />
	</Button>
</div>
