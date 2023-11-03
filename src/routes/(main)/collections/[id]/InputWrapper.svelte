<script lang="ts">
	export let name: string;
</script>

<div class="form-control">
	<label class="label flex flex-row items-center space-x-2.5">
		<span class="label-text font-semibold">{name}</span>

		<slot />
	</label>
</div>
