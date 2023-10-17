<script lang="ts">
	import { Button, Label } from 'flowbite-svelte';
	import { DotsVerticalOutline } from 'flowbite-svelte-icons';
	import IconBtn from '../IconBtn.svelte';

	export let id: string;
	export let name: string;
</script>

<div class="grow flex justify-between items-center">
	<Label for={id} class="grow truncate font-semibold text-base">{name}</Label>
	<IconBtn color="alternative" size="xxs">
		<DotsVerticalOutline />
	</IconBtn>
</div>
