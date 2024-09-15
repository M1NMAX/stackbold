import type { Color, Property, PropertyType, View } from '@prisma/client';

export type PropertyOptionCallbacks = {
	updOptColor: (propertyId: string, optionId: string, color: Color) => void;
	updOptValue: (propertyId: string, optionId: string, value: string) => void;
	deleteOpt: (propertyId: string, optionId: string) => void;
};

//TODO: change name
export type PropertyOptionsCallbacks = PropertyOptionCallbacks & {
	addOption: (propertyId: string, value: string) => void;
};

export type PropertyInputWrapperCallbacks = PropertyOptionsCallbacks & {
	duplicate: (id: string) => void;
	deleteProperty: (id: string) => void;
	updPropertyField: (
		pid: string,
		name: keyof Property,
		value: boolean | string | PropertyType | View[]
	) => void;
};
