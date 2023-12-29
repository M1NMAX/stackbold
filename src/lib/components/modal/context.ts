import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const MODAL_CTX = 'MODAL_CTX';
export function setModalState() {
	const modalState = writable(false);
	setContext(MODAL_CTX, modalState);
	return modalState;
}
export function getModalState() {
	return getContext<Writable<boolean>>(MODAL_CTX);
}
