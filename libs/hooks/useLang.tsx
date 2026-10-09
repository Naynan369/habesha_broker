import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";

export const useLang = () => {
    const { locale } = useRouter();
    if (locale == "am") {
        return am;
    } else {
        return en;
    }
};
