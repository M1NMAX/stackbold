<script lang="ts">
	import { Label } from '../ui/label';

	import { Item as RadioGroupItem } from '$lib/components/ui/radio-group';
	import { cn } from '$lib/utils';

	export let view: string;
	export let value: string;
</script>

<Label
	for={`view-${value}`}
	class={cn(
		'flex items-center justify-center p-1.5 rounded-sm text-secondary-foreground cursor-pointer',
		view === value && 'bg-secondary'
	)}
>
	<RadioGroupItem {value} id={`view-${value}`} class="sr-only" />

	<div class="flex items-center justify-between space-x-2 text-base">
		<slot />
	</div>
</Label>
