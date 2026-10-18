export const LISTING_FEE = 40;
export const LISTING_CURRENCY = "EUR";

export function isStripeTestSecret(secret: string | undefined): secret is string {
	return Boolean(secret && (secret.startsWith("sk_test_") || secret.startsWith("rk_test_")));
}

export function getListingPaymentConfig() {
	const secret = process.env.STRIPE_SECRET_KEY?.trim();

	return {
		enabled: isStripeTestSecret(secret),
	};
}
