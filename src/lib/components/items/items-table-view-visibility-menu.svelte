<script lang="ts">
	import { getScreenState } from '$lib/components/view';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Settings2 } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { containsView, PropertyIcon, toggleView } from '$lib/components/property';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { type Property, View } from '@prisma/client';
	import { createEventDispatcher } from 'svelte';

	export let properties: Property[];
	const isDesktop = getScreenState();

	const dispatch = createEventDispatcher<{
		updPropertyVisibility: { pid: string; name: string; value: View[] };
	}>();
</script>

{#if $isDesktop}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild let:builder>
			<Button variant="ghost" size="xs" builders={[builder]}>
				<Settings2 class="icon-xs" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start" class="w-56">
			<DropdownMenu.Label>Toggle properties visibility</DropdownMenu.Label>
			<DropdownMenu.Separator />

			<div class="p-1 space-y-2">
				{#each properties as property (property.id)}
					<div class="flex justify-between items-center">
						<Label for={property.id} class="flex items-center text-sm font-semibold">
							<PropertyIcon key={property.type} />
							{property.name}
						</Label>
						<Switch
							id={property.id}
							checked={containsView(property.visibleInViews, View.TABLE)}
							onCheckedChange={() => {
								dispatch('updPropertyVisibility', {
									pid: property.id,
									name: 'visibleInViews',
									value: toggleView(property.visibleInViews, View.TABLE)
								});
							}}
						/>
					</div>
				{/each}
			</div>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<Drawer.Root>
		<Drawer.Trigger asChild let:builder>
			<Button builders={[builder]} variant="ghost" size="xs">
				<Settings2 class="icon-xs" />
			</Button>
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Header class="py-1">
				<div class="flex items-center space-x-2">
					<div class="p-2.5 rounded bg-secondary">
						<Settings2 class="icon-sm" />
					</div>
					<div class="text-base font-semibold">Toggle properties visibility</div>
				</div>
			</Drawer.Header>
			<Drawer.Footer>
				<div class="p-1 space-y-2.5">
					{#each properties as property (property.id)}
						<div class="flex justify-between items-center">
							<Label for={property.id} class="flex items-center text-base ">
								<PropertyIcon key={property.type} class="icon-md mr-2" />
								{property.name}
							</Label>
							<Switch
								id={property.id}
								checked={containsView(property.visibleInViews, View.TABLE)}
								onCheckedChange={() => {
									dispatch('updPropertyVisibility', {
										pid: property.id,
										name: 'visibleInViews',
										value: toggleView(property.visibleInViews, View.TABLE)
									});
								}}
							/>
						</div>
					{/each}
				</div>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
