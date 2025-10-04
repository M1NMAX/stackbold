import type { MoveCollectionDetail, DeleteDetail } from '$lib/types';
import { getContext, setContext } from 'svelte';

export class ModalState {
	isOpen = $state(false);

	constructor(isOpen: boolean = false) {
		this.isOpen = isOpen;
	}

	open(_args?: unknown) {
		this.isOpen = true;
	}

	close() {
		this.isOpen = false;
	}

	toggle() {
		this.isOpen = !this.isOpen;
	}
}

export class DeleteContentModal extends ModalState {
	detail = $state<DeleteDetail>({ type: null });

	constructor(isOpen: boolean = false) {
		super(isOpen);
	}

	open(detail: DeleteDetail): void {
		super.open();
		this.detail = detail;
	}

	close(): void {
		super.close();
		this.detail = { type: null };
	}
}

export class MoveCollectionModal extends ModalState {
	detail = $state<MoveCollectionDetail | null>(null);

	constructor(isOpen: boolean = false) {
		super(isOpen);
	}

	open(detail: MoveCollectionDetail): void {
		super.open();
		this.detail = detail;
	}

	close(): void {
		super.close();
		this.detail = null;
	}
}

const DELETE_MODAL_CTX_KEY = Symbol('DELETE_MODAL_CTX_KEY');
export function setDeleteModalState() {
	return setContext(DELETE_MODAL_CTX_KEY, new DeleteContentModal());
}

export function getDeleteModalState() {
	return getContext<ReturnType<typeof setDeleteModalState>>(DELETE_MODAL_CTX_KEY);
}

const MOVE_COLLECTION_MODAL_CTX_KEY = Symbol('MOVE_COLLECTION_MODAL_CTX_KEY');
export function setMoveCollectionModalState() {
	return setContext(MOVE_COLLECTION_MODAL_CTX_KEY, new MoveCollectionModal());
}

export function getMoveCollectionModalState() {
	return getContext<ReturnType<typeof setMoveCollectionModalState>>(MOVE_COLLECTION_MODAL_CTX_KEY);
}
