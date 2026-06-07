<script lang="ts">
	let { children } = $props();
</script>

<main
	class="grow h-dvh flex flex-col gap-y-1 rounded-md bg-card text-secondary-foreground overflow-hidden"
>
	{@render children()}
</main>
