<script lang="ts">
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import Download from 'lucide-svelte/icons/download';
	import Plus from 'lucide-svelte/icons/plus';
	import Trash from 'lucide-svelte/icons/trash';
	import { extractFileNameFromUrl, joinFilesName, separateMultiselectOptions } from './index.js';
	import {
		AdaptiveWrapper,
		Badge,
		Button,
		buttonVariants,
		HSeparator
	} from '$lib/components/base/index.js';
	import {
		DEFAULT_STRING_DELIMITER,
		FILE_ICONS,
		MAX_FILE_SIZE,
		MAX_PROPERTY_FILE_COUNT,
		PROPERTY_COLORS
	} from '$lib/constant/index.js';
	import type { Nullable } from '$lib/types.js';
	import { Color, type Property } from '@prisma/client';
	import { getToastState, ModalState } from '$lib/states/index.js';
	import { isAudioFile, isImageFile, isVideoFile, tm, uploadFileToUrl } from '$lib/utils/index.js';
	import { getItemState } from '$lib/components/items/index.js';

	type Props = {
		itemId: string;
		value: string;
		property: Property;
		buttonClass?: string;
	};

	let { itemId, value, property, buttonClass }: Props = $props();
	let files = $derived(separateMultiselectOptions(value));
	let input = $state<HTMLInputElement | null>(null);
	let selected = $state<Nullable<string>>(null);
	const wrapperState = new ModalState();

	const itemState = getItemState();
	const toastState = getToastState();

	function onclickAddFile() {
		if (!input) return;
		input.click();
	}

	async function handleFileChange() {
		if (!input || !input.files) return;

		const tid = toastState.loading('Uploading file...');

		try {
			const file = input.files[0];

			if (file.size >= MAX_FILE_SIZE) {
				toastState.error(`File ${file.name} exceeds the allowed size limit`);
				return;
			}

			const uploadUrl = await itemState.generatePresignedUrl(itemId, property.id, file.name);
			const response = await uploadFileToUrl(uploadUrl, file);

			if (!response.ok) {
				toastState.error();
				return;
			}

			await itemState.updPropertyRef(itemId, {
				id: property.id,
				value: joinFilesName(files, extractFileNameFromUrl(uploadUrl))
			});
		} catch (_) {
			toastState.error();
		} finally {
			toastState.remove(tid);
		}
	}

	async function onclickDownload() {
		if (!selected) return;
		const tid = toastState.loading('Downloading file...');

		try {
			const downloadUrl = await itemState.getDownloadUrl(itemId, property.id, selected);

			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = selected;
			link.style.display = 'none';
			document.body.appendChild(link);
			link.click();

			document.body.removeChild(link);
		} catch (_) {
			toastState.error();
		} finally {
			toastState.remove(tid);
		}
	}

	async function onclickDelete() {
		if (!selected) return;
		const tid = toastState.loading('Deleting file...');

		try {
			await itemState.deleteFile(itemId, property.id, selected);
			const result = files.filter((f) => f !== selected).join(DEFAULT_STRING_DELIMITER);
			await itemState.updPropertyRef(itemId, { id: property.id, value: result });

			selected = null;
		} catch (_) {
			toastState.error();
		} finally {
			toastState.remove(tid);
		}
	}
	function getIconKey(fileName: string) {
		if (isImageFile(fileName)) return 'image';
		else if (isVideoFile(fileName)) return 'video';
		else if (isAudioFile(fileName)) return 'audio';
		else return 'text';
	}

	$effect(() => {
		if (!wrapperState.isOpen) selected = null;
	});
</script>

<AdaptiveWrapper
	sameWidth
	bind:open={wrapperState.isOpen}
	floatingAlign="start"
	floatingClass="bg-secondary focus-within:bg-secondary/80"
	triggerClass={tm(
		buttonVariants({
			theme: 'ghost',
			variant: 'menu',
			class: tm('overflow-hidden', buttonClass)
		})
	)}
>
	{#snippet trigger()}
		{#each files.slice(0, 3) as file (file)}
			<Badge class={PROPERTY_COLORS[Color.GRAY]}>
				{@render icon(file)}
				<span class="overflow-hidden whitespace-nowrap text-ellipsis">
					{file}
				</span>
			</Badge>
		{/each}

		{#if files.length > 3}
			<Badge class={PROPERTY_COLORS[Color.GRAY]}>
				+{files.length - 3} More
			</Badge>
		{/if}
	{/snippet}

	<p class="md:sr-only block font-semibold text-sm text-center px-0 py-1 select-none">
		{property.name}
	</p>

	<div
		class="flex flex-col p-1 rounded-md shadow-md outline-none bg-popover text-popover-foreground"
	>
		{@render content()}
	</div>
</AdaptiveWrapper>

{#snippet content()}
	{#if selected}
		<div class="w-full flex items-center gap-x-1">
			<Button theme="ghost" variant="compact" class="w-7" onclick={() => (selected = null)}>
				<ChevronLeft />
			</Button>
			<span class="grow pr-4 py-1 font-semibold text-sm text-center md:text-left">
				{selected}
			</span>
		</div>
		<HSeparator />
		<Button theme="ghost" variant="menu" onclick={onclickDownload}>
			<Download />
			<span> Download </span>
		</Button>
		<Button theme="danger" variant="menu" onclick={onclickDelete}>
			<Trash />
			<span> Delete </span>
		</Button>
	{:else}
		{#if value}
			{#each files as file (file)}
				<Button theme="ghost" variant="menu" onclick={() => (selected = file)}>
					{@render icon(file)}
					<span class="grow text-start overflow-hidden whitespace-nowrap text-ellipsis">
						{file}
					</span>
				</Button>
			{/each}
			<HSeparator />
		{/if}

		<input bind:this={input} onchange={handleFileChange} type="file" name="file" class="hidden" />
		<Button
			theme="ghost"
			variant="menu"
			onclick={onclickAddFile}
			disabled={files.length >= MAX_PROPERTY_FILE_COUNT}
		>
			<Plus />
			<span>
				Add File {files.length >= MAX_PROPERTY_FILE_COUNT ? ' (Max file attachments reached)' : ''}
			</span>
		</Button>
	{/if}
{/snippet}

{#snippet icon(fileName: string)}
	{@const Icon = FILE_ICONS[getIconKey(fileName)]}
	<Icon class="size-4 shrink-0" aria-level="File type icon" />
{/snippet}
