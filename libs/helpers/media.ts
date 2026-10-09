export function getMediaUrl(value: string | null | undefined, folder: "items" | "profile") {
	if (!value || typeof value !== "string") return undefined;
	const source = value.trim();
	if (!source) return undefined;
	if (/^(https?:)?\/\//i.test(source) || /^(data|blob):/i.test(source)) return source;

	const normalized = source.replace(/\\/g, "/").replace(/^\.\//, "");
	const encodePath = (path: string) => path.split("/").map((part) => encodeURIComponent(part)).join("/");
	if (normalized.startsWith("/")) return `/${encodePath(normalized.replace(/^\/+/, ""))}`;

	const folderPrefix = `${folder}/`;
	const relativePath = normalized.startsWith(folderPrefix) ? normalized : `${folderPrefix}${normalized}`;
	return `/${encodePath(relativePath)}`;
}
