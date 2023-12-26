<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head><title>Admin - Users - Stackbold</title></svelte:head>

<div>
	<pre>
        {JSON.stringify(data.users, null, 2)}
    </pre>
</div>
