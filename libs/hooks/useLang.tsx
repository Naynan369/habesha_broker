import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";

export const useLang = () => {
	const { locale, asPath } = useRouter();
	// Next normally supplies `locale`; the path check also covers route states
	// where the localized URL is available before the router locale is ready.
	const isAmharic = locale === "am" || /^\/am(?:\/|$)/.test(asPath);
	return isAmharic ? am : en;
};
