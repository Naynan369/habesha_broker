export function isOwnedBlobUrl(value: unknown, purpose: "listing" | "profile", userId: string, mediaKind: "image" | "video" = "image") {
	if (typeof value !== "string" || value.length > 2048) return false;
	try {
		const url = new URL(value);
		const pathname = decodeURIComponent(url.pathname);
		const extension = pathname.split("/").pop()?.split(".").pop()?.toLowerCase();
		const allowedExtensions = mediaKind === "video" ? ["mp4", "webm", "mov"] : ["jpg", "jpeg", "png", "webp", "gif"];
		return url.protocol === "https:" &&
			url.hostname.endsWith(".public.blob.vercel-storage.com") &&
			pathname.startsWith(`/${purpose}/${userId}/`) &&
			Boolean(extension && allowedExtensions.includes(extension)) &&
			!pathname.includes("..") &&
			!url.search;
	} catch {
		return false;
	}
}
