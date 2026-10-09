export const formatPrice = (price: number) =>
	Intl.NumberFormat("en-Us").format(price);

export const getBaseUrl = () =>
	process.env.NODE_ENV === "development"
		? "http://localhost:3000"
		: process.env.DOMAIN;
