import { DEFAULT_NUMBER_DECIMALS } from '$lib/constant';

globalThis.baseIdCounter ??= { current: 0 };

/**
 * Generates a unique ID based on a global counter.
 */
export function useId(prefix = 'sb-id') {
	globalThis.baseIdCounter.current++;
	return `${prefix}-${globalThis.baseIdCounter.current}`;
}

export function randomIntFromInterval(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export function sanitizeNumbericInput(el: HTMLInputElement) {
	const current = el.value;
	const sanitized = sanitizeNumber(current);
	if (sanitized === current) return current;

	const diff = sanitized.length - current.length;
	const calculatedCursorPosition = Math.max(0, (el.selectionStart ?? 0) + diff);

	el.value = sanitized;
	el.setSelectionRange(calculatedCursorPosition, calculatedCursorPosition);

	return sanitized;
}

export function sanitizeNumber(value: string) {
	let sanitized = value.replace(/[^0-9,.]/g, '');

	sanitized = sanitized.replace(/,/g, '.');

	const parts = sanitized.split('.');
	if (parts.length > 2) {
		sanitized = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
	}

	return sanitized;
}

export function formatNumber(value: number, format: string | null, decimals: number | null) {
	if (value === 0) return '';
	const options: Intl.NumberFormatOptions = {
		minimumFractionDigits: decimals ?? DEFAULT_NUMBER_DECIMALS,
		maximumFractionDigits: decimals ?? DEFAULT_NUMBER_DECIMALS
	};
	if (format === 'PERCENTAGE') {
		return new Intl.NumberFormat(undefined, { ...options, style: 'percent' }).format(value / 100);
	}
	if (format) {
		return new Intl.NumberFormat(undefined, {
			...options,
			style: 'currency',
			currency: format
		}).format(value);
	}

	return new Intl.NumberFormat(undefined, { ...options }).format(value);
}
