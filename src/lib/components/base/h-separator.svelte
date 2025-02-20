<script lang="ts">
	type Props = {
		class?: string;
	};

	let { class: className }: Props = $props();
</script>

<hr class={['bg-muted my-1 h-px', className]} />
