export type OrderType = 'asc' | 'desc';

export type SortOption<T> = {
	label: string;
	field: keyof T;
	order: OrderType;
};

export function sortFun<T, K extends keyof T>(field: K, order: OrderType) {
	function sortStr(a: T, b: T, field: K) {
		const left = a[field];
		const right = b[field];

		if (left < right) return -1;

		if (left > right) return 1;

		return 0;
	}

	type DateKey<D> = D & (D extends Date ? D : never);

	function sortDate(a: T, b: T, field: DateKey<K>) {
		const left = a[field] as Date;
		const right = b[field] as Date;

		if (left.getTime() < right.getTime()) return -1;
		if (left.getTime() > right.getTime()) return 1;

		return 0;
	}

	return function (a: T, b: T) {
		let result = 0;
		if (a[field] === b[field]) return result;

		if (typeof a[field] === 'string') result = sortStr(a, b, field);
		else if (a[field] instanceof Date) result = sortDate(a, b, field as DateKey<K>);

		return order === 'asc' ? +result : -result;
	};
}
