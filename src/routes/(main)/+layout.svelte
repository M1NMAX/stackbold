<script lang="ts">
	import {
		CheckCircle2,
		Database,
		Dna,
		KanbanSquare,
		LogOut,
		PackagePlus,
		PanelLeftInactive,
		Plus,
		Search,
		Settings,
		Trash2
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { Sidebar, SidebarCollection, SidebarItem } from '$lib/components';
	import toast from 'svelte-french-toast';
	import { trpc } from '$lib/trpc/client';

	import { goto, invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { writable } from 'svelte/store';
	import { setContext, tick } from 'svelte';
	import { enhance } from '$app/forms';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { DEFAULT_FEEDBACK_ERR_MESSAGE } from '$lib/constant';
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils';
	import SidebarGroupMenu from '$lib/components/sidebar/SidebarGroupMenu.svelte';

	export let data: LayoutData;

	$: groups = data.groups;

	$: favourites = data.collections.filter((collection) => collection.isFavourite);

	$: activeUrl = $page.url.pathname;
	$: activeCollection = (id: string) => $page.url.pathname === `/collections/${id}`;

	const sidebarStateStore = writable(true);
	setContext('sidebarStateStore', sidebarStateStore);

	// Feedback
	const onSuccess = async (msg: string) => {
		await invalidateAll();
		toast.success(msg);
	};

	const onError = async (error: unknown, msg: string | null = null) => {
		console.log(error);
		toast.error(msg ? msg : DEFAULT_FEEDBACK_ERR_MESSAGE);
	};

	let isNewGroupInputShow = false;

	const handleCreateGroup = async (name: string) => {
		try {
			const createdGroup = await trpc().groups.create.mutate({ name });
			await onSuccess('New group created successfully');
		} catch (error) {
			onError(error);
		}
	};

	const handleKeydownGroup = (
		e: KeyboardEvent & {
			currentTarget: EventTarget & HTMLInputElement;
		}
	) => {
		const closeTargetInput = () => {
			tick().then(() => {
				isNewGroupInputShow = false;
			});
		};

		if (e.key === 'Escape') closeTargetInput();
		else if (e.key === 'Enter') {
			const name = e.currentTarget.value;

			if (name.length < 1 && name.length > 256) {
				onError({}, 'Invalid group name');
			}

			handleCreateGroup(name);
			closeTargetInput();
		}
	};

	let isCreateCollectionModalOpen = false;
	let createCollectionDetail: { name: string; groupId: string | undefined } = {
		name: '',
		groupId: undefined
	};

	const handleCreateCollection = async () => {
		try {
			//TODO: validation
			const collection = await trpc().collections.create.mutate({ ...createCollectionDetail });

			await onSuccess('New collection created');
			isCreateCollectionModalOpen = false;
		} catch (error) {
			onError(error);
		}
	};
</script>

<div class="h-screen flex bg-secondary">
	<Sidebar class={`${$sidebarStateStore ? 'w-64' : 'w-0'} transition-all`}>
		<div
			class="h-full flex flex-col space-y-2 overflow-hidden px-0 py-1.5 rounded-none bg-card text-card-foreground"
		>
			<div class="w-full flex justify-between space-x-0.5 px-1">
				<DropdownMenu.Root>
					<div class="w-full flex items-center justify-between space-x-1">
						<DropdownMenu.Trigger asChild let:builder>
							<Button
								builders={[builder]}
								variant="secondary"
								class="h-9 w-9 flex items-center justify-center p-0.5 rounded-sm ring-1 ring-card"
							>
								<img
									src={`https://api.dicebear.com/7.x/shapes/svg?seed=${data.user.name}`}
									class="h-7 w-7 rounded-sm"
									alt="avatar"
								/>
							</Button>
						</DropdownMenu.Trigger>
						<Button variant="secondary" class="grow h-9 justify-start space-x-1 rounded-sm">
							<Search class="icon-sm" />
							<span> Search</span>
						</Button>

						<Button
							variant="secondary"
							size="icon"
							on:click={() => ($sidebarStateStore = false)}
							class="rounded-sm"
						>
							<PanelLeftInactive class="icon-sm" />
							<span class="sr-only"> Hide sidebar </span>
						</Button>
					</div>
					<DropdownMenu.Content class="w-56">
						<DropdownMenu.Label>{data.user.name} | {data.user.email}</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Item href="/settings">
								<Settings class="mr-2 h-4 w-4" />
								<span>Settings</span>
							</DropdownMenu.Item>
						</DropdownMenu.Group>

						<DropdownMenu.Separator />

						<form method="post" action="/?/logout" use:enhance>
							<!-- //TODO: add action -->
							<DropdownMenu.Item>
								<LogOut class="mr-2 h-4 w-4" />
								<span>Log out</span>
							</DropdownMenu.Item>
						</form>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
			<div class="space-y-0.5 px-0">
				<SidebarItem label="Dashboard" href="/" active={activeUrl === '/'}>
					<svelte:fragment slot="icon">
						<KanbanSquare />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Templates" href="/templates" active={activeUrl === '/templates'}>
					<svelte:fragment slot="icon">
						<Dna />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem
					label="All Collections"
					href="/collections"
					active={activeUrl === '/collections'}
				>
					<svelte:fragment slot="icon">
						<Database />
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem label="Trash" href="/trash" active={activeUrl === '/trash'}>
					<svelte:fragment slot="icon">
						<Trash2 />
					</svelte:fragment>
				</SidebarItem>
			</div>

			<!-- TODO: handle scroll, when there are too many collections -->

			<Accordion.Root
				class="grow w-full space-y-2"
				multiple
				value={['item-0'].concat(data.groups.map((_group, idx) => `item-${idx + 1}`))}
			>
				<Accordion.Item value="item-0">
					<Accordion.Trigger
						class="justify-start py-0.5 px-1 text-sm font-semibold  hover:no-underline hover:bg-muted"
					>
						Favourites</Accordion.Trigger
					>
					<Accordion.Content>
						{#each favourites as collection}
							<SidebarCollection {collection} active={activeCollection(collection.id)} />
						{/each}
					</Accordion.Content>
				</Accordion.Item>

				{#each groups as group, idx (group.id)}
					{@const groupCollections = data.collections.filter(
						(collection) => collection.groupId && collection.groupId === group.id
					)}
					<Accordion.Item value={`item-${idx + 1}`}>
						<Accordion.Trigger
							class="justify-start space-x-2 py-0.5 px-1 text-sm font-semibold  hover:no-underline hover:bg-muted"
						>
							{group.name}
							<svelte:fragment slot="extra">
								<SidebarGroupMenu groupId={group.id} />
							</svelte:fragment>
						</Accordion.Trigger>

						<Accordion.Content>
							{#each groupCollections as collection}
								<SidebarCollection {collection} active={activeCollection(collection.id)} />
							{/each}
						</Accordion.Content>
					</Accordion.Item>
				{/each}
				<Accordion.Item value="item-x">
					<Accordion.Trigger
						class="justify-start py-0.5 px-1 text-sm font-semibold  hover:no-underline hover:bg-muted"
					>
						All Collections
					</Accordion.Trigger>

					<Accordion.Content>
						{#each data.collections as collection}
							<SidebarCollection {collection} active={activeCollection(collection.id)} />
						{/each}
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>

			{#if isNewGroupInputShow}
				<div class="relative px-1">
					<input
						id="newGroupInput"
						placeholder="New group"
						class="w-full input input-ghost pl-10"
						on:keydown={handleKeydownGroup}
					/>
				</div>
			{/if}
			<div class="flex items-center justify-between space-x-1 px-1">
				<Button
					variant="secondary"
					class="grow h-9 space-x-2 rounded-sm"
					on:click={() => (isCreateCollectionModalOpen = true)}
				>
					<Plus class="icon-sm" />
					<span> New collection </span>
				</Button>
				<Button
					variant="secondary"
					size="icon"
					class="rounded-sm"
					on:click={() => {
						isNewGroupInputShow = true;
						tick().then(() => {
							document.getElementById('newGroupInput')?.focus();
						});
					}}
				>
					<PackagePlus class="icon-sm" />
					<span class="sr-only">New group</span>
				</Button>
			</div>
		</div>
	</Sidebar>

	<div class="w-full flex space-x-1 m-1 relative bg-secondary">
		<slot />
	</div>
</div>

<Dialog.Root bind:open={isCreateCollectionModalOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>New collection</Dialog.Title>
		</Dialog.Header>
		<form on:submit|preventDefault={handleCreateCollection} class="flex flex-col space-y-2">
			<label for="name"> Name </label>
			<input
				id="name"
				type="text"
				name="name"
				placeholder="Tasks"
				required
				class="input input-sm input-ghost bg-gray-200"
				bind:value={createCollectionDetail.name}
			/>

			<label for="location"> Group </label>

			<RadioGroup.Root id="location" bind:value={createCollectionDetail.groupId}>
				<Label
					for="no-group"
					class={cn(
						'flex justify-between items-center h-7 py-0.5 px-1.5 rounded-sm text-secondary-foreground bg-secondary',
						createCollectionDetail.groupId === undefined && 'bg-card'
					)}
				>
					<RadioGroup.Item value="no-group" id="no-group" class="sr-only" />
					<span> Without group </span>

					<CheckCircle2
						class={cn(
							'icon-sm text-primary',
							createCollectionDetail.groupId !== undefined && 'text-transparent'
						)}
					/>
				</Label>
				{#each groups as group}
					<Label
						for={group.id}
						class={cn(
							'flex justify-between items-center h-7 py-0.5 px-1.5 rounded-sm text-secondary-foreground bg-secondary',
							createCollectionDetail.groupId === group.id && 'bg-card'
						)}
					>
						<RadioGroup.Item value={group.id} id={group.id} class="sr-only" />
						<span>
							{group.name}
						</span>

						<CheckCircle2
							class={cn(
								'icon-sm text-primary',
								createCollectionDetail.groupId !== group.id && 'text-transparent'
							)}
						/>
					</Label>
				{/each}
			</RadioGroup.Root>

			<!-- //TODO: upd form or change logic  -->
			<Button type="submit" class="w-ful btn btn-sm btn-primary">Create</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
