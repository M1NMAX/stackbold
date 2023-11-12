export interface IBaseSchema {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

export type OrderType = 'asc' | 'desc';

const sortDate = <
	T extends IBaseSchema,
	K extends keyof Pick<IBaseSchema, 'createdAt' | 'updatedAt'>
>(
	a: T,
	b: T,
	field: K
) => {
	const left = a[field];
	const right = b[field];

	if (left.getTime() < right.getTime()) return -1;
	if (left.getTime() > right.getTime()) return 1;

	return 0;
};

const sortString = <T extends IBaseSchema, K extends keyof T>(a: T, b: T, field: K) => {
	const left = a[field];
	const right = b[field];

	if (left < right) return -1;

	if (left > right) return 1;

	return 0;
};

const sortFun = <K extends keyof IBaseSchema>(field: K, order: OrderType) => {
	return <T extends IBaseSchema>(a: T, b: T) => {
		if (a[field] === b[field]) return 0;

		let result = 0;

		if (typeof a[field] === 'string') result = sortString(a, b, field);
		else if (a[field] instanceof Date) result = sortDate(a, b, 'createdAt');

		return order === 'asc' ? +result : -result;
	};
};

export default sortFun;
