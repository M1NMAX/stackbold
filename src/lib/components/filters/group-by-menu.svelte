<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { getPropertyState, PropertyIcon } from '$lib/components/property';
	import { Rows3, SquareSlash } from 'lucide-svelte';

	type Props = {
		value: string;
		updValue: (propId: string) => void;
	};

	let { value, updValue }: Props = $props();

	const propertyState = getPropertyState();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button builders={[builder]} variant="secondary" size="sm" class="hidden md:block">
			Group by
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56">
		<DropdownMenu.Label>Group by</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.RadioGroup
			{value}
			onValueChange={(value) => updValue(value === 'none' || !value ? '' : value)}
		>
			<DropdownMenu.RadioItem value="none">None</DropdownMenu.RadioItem>

			{#each propertyState.properties as property (property.id)}
				{#if property.type === 'SELECT' || property.type === 'CHECKBOX'}
					<DropdownMenu.RadioItem value={property.id}>
						{property.name}
					</DropdownMenu.RadioItem>
				{/if}
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
<Drawer.Root>
	<Drawer.Trigger asChild let:builder>
		<Button builders={[builder]} variant="secondary" class="md:hidden">
			<Rows3 class="icon-xs" />
		</Button>
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header class="py-1">
			<div class="flex items-center space-x-2">
				<div class="p-2.5 rounded bg-secondary">
					<Rows3 class="icon-sm" />
				</div>
				<div class="text-base font-semibold">Group by</div>
			</div>
		</Drawer.Header>
		<Drawer.Footer class="pt-2 px-1 ">
			<RadioGroup.Root
				id="groupBy"
				{value}
				onValueChange={(value) => updValue(value === 'none' || !value ? '' : value)}
				class="px-2 py-1 rounded-md bg-secondary/40"
			>
				<div class="flex items-center justify-between">
					<Label for="group-by-none" class="w-full flex items-center ">
						<SquareSlash class="icon-sm mr-2" />
						<span class="grow font-semibold text-base">None</span>
					</Label>

					<RadioGroup.Item id="group-by-none" value="none" />
				</div>
				{#each propertyState.properties as property (property.id)}
					{#if property.type === 'SELECT' || property.type === 'CHECKBOX'}
						<div class="w-full flex items-center justify-between">
							<Label for={`group-by-${property.id}`} class="w-full flex items-center">
								<PropertyIcon key={property.type} />
								<span class="grow font-semibold text-base">{property.name}</span>
							</Label>

							<RadioGroup.Item id={`group-by-${property.id}`} value={property.id} />
						</div>
					{/if}
				{/each}
			</RadioGroup.Root>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
