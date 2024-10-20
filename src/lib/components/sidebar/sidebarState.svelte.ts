import { getContext, setContext } from 'svelte';
import { ModalState } from '$lib/components/modal';

const SIDEBAR_CTX = Symbol('SIDEBAR_CTX');
export function setSidebarState() {
	return setContext(SIDEBAR_CTX, new ModalState(true));
}

export function getSidebarState() {
	return getContext<ReturnType<typeof setSidebarState>>(SIDEBAR_CTX);
}
