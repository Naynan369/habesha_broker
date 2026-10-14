export const formatPrice = (price: number) =>
	Intl.NumberFormat("en-US").format(price);
