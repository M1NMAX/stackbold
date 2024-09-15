import { getContext, setContext } from 'svelte';

export class ModalState {
	isOpen = $state(false);

	constructor(isOpen: boolean = false) {
		this.isOpen = isOpen;
	}

	openModal() {
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

const CRT_COLLECTION_MODAL_CTX_KEY = Symbol('CRT_COLLECTION_MODAL_CTX_KEY');
export function setCtrCollectionModalState() {
	return setContext(CRT_COLLECTION_MODAL_CTX_KEY, new CreateCollectionModal());
}

export function getCrtCollectionModalState() {
	return getContext<ReturnType<typeof setCtrCollectionModalState>>(CRT_COLLECTION_MODAL_CTX_KEY);
}
