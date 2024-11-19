<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { buttonVariants } from '$lib/components/ui/button';
	import { getPropertyState, PropertyIcon } from '$lib/components/property';
	import { Check, Rows3, SquareSlash } from 'lucide-svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { ModalState } from '$lib/components/modal';
	import { cn } from '$lib/utils';

	type Props = {
		value: string;
		updValue: (propId: string) => void;
	};

	let { value, updValue }: Props = $props();
	const propertyState = getPropertyState();

	const menuState = new ModalState();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={buttonVariants({ variant: 'secondary', size: 'sm', className: 'hidden md:block' })}
	>
		Group by
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56">
		<DropdownMenu.Label>Group by</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.RadioGroup
			{value}
			onValueChange={(value) => updValue(value === 'none' || !value ? '' : value)}
		>
			{#each propertyState.properties as property (property.id)}
				{#if property.type === 'SELECT' || property.type === 'CHECKBOX'}
					<DropdownMenu.RadioItem value={property.id}>
						<PropertyIcon key={property.type} />
						{property.name}
					</DropdownMenu.RadioItem>
				{/if}
			{/each}

			<DropdownMenu.Separator />

			<DropdownMenu.RadioItem value="none">
				<SquareSlash class="icon-xs mr-2" />
				None
			</DropdownMenu.RadioItem>
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
<Drawer.Root bind:open={menuState.isOpen}>
	<Drawer.Trigger
		class={buttonVariants({ variant: 'secondary', size: 'icon', className: 'md:hidden' })}
	>
		<Rows3 />
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header class="pt-2 pb-0 ">
			<span class="flex items-center gap-x-2">
				<span class="p-1.5 rounded-md bg-secondary">
					<Rows3 class="icon-sm" />
				</span>

				<Drawer.Title class="text-left">Group by</Drawer.Title>
			</span>
		</Drawer.Header>
		<Drawer.Footer class="pt-2 pb-0 px-0">
			<!-- FIXME: onValueChange does not work correctly, it reset to first value when drawer close -->
			<RadioGroup.Root {value} class="px-0 py-1 gap-y-0">
				{#each propertyState.properties as property (property.id)}
					{#if property.type === 'SELECT' || property.type === 'CHECKBOX'}
						<Label
							for={`group-by-${property.id}`}
							class="w-full flex items-center justify-between px-4 py-1 hover:bg-secondary/40"
						>
							<PropertyIcon key={property.type} />
							<span class="grow font-semibold text-base">{property.name}</span>

							<Check class={cn('size-5', value !== property.id && 'text-transparent')} />
							<RadioGroup.Item
								id={`group-by-${property.id}`}
								value={property.id}
								class="sr-only"
								onclick={() => {
									updValue(property.id);
									menuState.close();
								}}
							/>
						</Label>
					{/if}
				{/each}
				<Separator class="my-1" />
				<Label
					for="group-by-none"
					class="w-full flex items-center justify-between px-4 py-1 hover:bg-secondary/40"
				>
					<SquareSlash class="icon-xs mr-2" />
					<span class="grow font-semibold text-base">None</span>

					<RadioGroup.Item
						id="group-by-none"
						value="none"
						class="sr-only"
						onclick={() => {
							updValue('');
							menuState.close();
						}}
					/>
					<Check class={cn('size-5', value !== 'none' && 'text-transparent')} />
				</Label>
			</RadioGroup.Root>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
