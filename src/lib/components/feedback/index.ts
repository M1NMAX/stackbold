import { goto, invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';

export const DEFAULT_FEEDBACK_ERR_MESSAGE = 'Something went wrong :(, try again';

export const onSuccess = async (msg: string) => {
	await invalidateAll();
	toast.success(msg);
};

export const redirectToast = (msg: string, url: string) => {
	toast(msg, {
		action: {
			label: 'Go',
			onClick: () => goto(url)
		}
	});
};

export const onError = async (error: unknown, msg: string | null = null) => {
	console.log(error);
	toast.error(msg ? msg : DEFAULT_FEEDBACK_ERR_MESSAGE);
};
