import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const CRT_DIALOG_CTX = Symbol('CRT_DIALOG_CTX');

type CrtDialogDetail = { open: boolean; defaultGroup?: string };
export function setCrtCollectionDialogState(initial: CrtDialogDetail) {
	const dialogState = writable(initial);
	setContext(CRT_DIALOG_CTX, dialogState);
	return dialogState;
}

export function getCrtCollectionDialogState() {
	return getContext<Writable<CrtDialogDetail>>(CRT_DIALOG_CTX);
}
