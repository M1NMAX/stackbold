import { type DeleteDetail } from '$lib/types';
import { getContext, setContext } from 'svelte';

export class ModalState {
	isOpen = $state(false);

	constructor(isOpen: boolean = false) {
		this.isOpen = isOpen;
	}

	openModal(_args?: unknown) {
		this.isOpen = true;
	}

	closeModal() {
		this.isOpen = false;
	}
}

export class CreateCollectionModal extends ModalState {
	group = $state<string | undefined>(undefined);

	constructor(isOpen: boolean = false) {
		super(isOpen);
	}

	openModal(group?: string | undefined): void {
		super.openModal();
		this.group = group;
	}

	closeModal(): void {
		super.closeModal();
		this.group = undefined;
	}
}

export class DeleteContentModal extends ModalState {
	detail = $state<DeleteDetail>({ type: null });

	constructor(isOpen: boolean = false) {
		super(isOpen);
	}

	openModal(detail: DeleteDetail): void {
		super.openModal();
		this.detail = detail;
	}

	closeModal(): void {
		super.closeModal();
		this.detail = { type: null };
	}
}

const CRT_COLLECTION_MODAL_CTX_KEY = Symbol('CRT_COLLECTION_MODAL_CTX_KEY');
export function setCtrCollectionModalState() {
	return setContext(CRT_COLLECTION_MODAL_CTX_KEY, new CreateCollectionModal());
}

export function getCrtCollectionModalState() {
	return getContext<ReturnType<typeof setCtrCollectionModalState>>(CRT_COLLECTION_MODAL_CTX_KEY);
}

const DELETE_MODAL_CTX_KEY = Symbol('DELETE_MODAL_CTX_KEY');
export function setDeleteModalState() {
	return setContext(DELETE_MODAL_CTX_KEY, new DeleteContentModal());
}

export function getDeleteModalState() {
	return getContext<ReturnType<typeof setDeleteModalState>>(DELETE_MODAL_CTX_KEY);
}
