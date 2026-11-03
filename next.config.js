module.exports = {
	allowedDevOrigins: ["127.0.0.1"],
	reactStrictMode: true,
	experimental: {
		agentUpgrade: "security",
	},
	transpilePackages: ["iron-session", "iron-webcrypto", "@peculiar/webcrypto"],
	i18n: {
		locales: ["en", "am"],
		defaultLocale: "en",
	},
	images: {
		formats: ["image/webp"],
	},
	async redirects() {
		return [{ source: "/items", destination: "/explore", permanent: true }];
	},
};
