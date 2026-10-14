export const getBaseUrl = (): string | undefined => {
	if (process.env.NODE_ENV === "development") {
		return process.env.DOMAIN?.trim() || "http://localhost:3000";
	}

	const configuredDomain = process.env.DOMAIN?.trim();
	const vercelDomain = process.env.VERCEL_URL?.trim();
	const candidate = configuredDomain || (vercelDomain ? "https://" + vercelDomain : "");

	if (!candidate) return undefined;

	try {
		const normalized = candidate.includes("://") ? candidate : "https://" + candidate;
		return new URL(normalized).origin;
	} catch (_error) {
		return undefined;
	}
};
