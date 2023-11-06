<script lang="ts">
	export let name: string;
</script>

<div class="form-control">
	<label class="label grid grid-cols-10 items-center space-x-2.5 px-2">
		<span class="label-text font-semibold">{name}</span>

		<slot />
	</label>
</div>
