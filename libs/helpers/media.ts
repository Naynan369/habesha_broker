export function getMediaUrl(value: string | null | undefined, folder: "items" | "profile") {
	if (!value || typeof value !== "string") return undefined;
	const source = value.trim();
	if (!source) return undefined;
	if (/^(https?:)?\/\//i.test(source)) return source;
	if (source.startsWith("/")) return source;
	const safePath = source.split("/").map((part) => encodeURIComponent(part)).join("/");
	return `/${folder}/${safePath}`;
}
