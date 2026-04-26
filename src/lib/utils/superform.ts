import { superForm, type SuperValidated } from 'sveltekit-superforms';
import type { ToastState } from '$lib/states/index.js';

export function useSuperForm<T extends Record<string, unknown>>(
	data: SuperValidated<T>,
	toastState: ToastState
) {
	return superForm(data, {
		onResult: ({ result }) => {
			if (result.type == 'success' && result.data != null) {
				toastState.success(result.data.message);
				return;
			}
			if (result.type !== 'failure') return;
			if (result.data == null || result.data.form.errors._errors == null) return;
			toastState.error(result.data.form.errors._errors);
		}
	});
}
