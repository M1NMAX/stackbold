import { invalidateAll } from '$app/navigation';
import { addToast } from './Toaster.svelte';

export const DEFAULT_FEEDBACK_ERR_MESSAGE = 'Something went wrong :(, try again';

export const successToast = (msg: string) => {
	addToast({
		data: { type: 'success', message: msg }
	});
};

export const redirectToast = (message: string, url: string) => {
	addToast({
		data: { type: 'redirect', message, url }
	});
};

export const errorToast = (msg: string) => {
	addToast({
		data: { type: 'error', message: msg }
	});
};

export const onSuccess = async (msg: string) => {
	await invalidateAll();
	successToast(msg);
};

export const onError = async (error: unknown, msg: string | null = null) => {
	console.log(error);
	errorToast(msg ? msg : DEFAULT_FEEDBACK_ERR_MESSAGE);
};
