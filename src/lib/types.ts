export type Color = 'dark' | 'gray' | 'red' | 'green' | 'blue';

export type Colors = { [key in Color]?: string };

export type Size = 'xxs' | 'xs';
export type Sizes = {
	[key in Size]: string;
};
