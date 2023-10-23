<script lang="ts">
	export let alighEnd: boolean = true;
</script>

<div class={`dropdown ${alighEnd && 'dropdown-end'}`}>
	<slot name="button" />

	<ul class="dropdown-content z-[1] menu w-56">
		<slot />
	</ul>
</div>
