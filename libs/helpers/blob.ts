export const MEDIA_CONTENT_TYPES = {
	image: {
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/webp": "webp",
		"image/gif": "gif",
	},
	video: {
		"video/mp4": "mp4",
		"video/webm": "webm",
		"video/quicktime": "mov",
	},
} as const;

export type MediaKind = keyof typeof MEDIA_CONTENT_TYPES;

export function mediaContentTypes(mediaKind: MediaKind) {
	return Object.keys(MEDIA_CONTENT_TYPES[mediaKind]);
}

export function mediaExtension(mediaKind: MediaKind, contentType: string) {
	return (MEDIA_CONTENT_TYPES[mediaKind] as Record<string, string>)[contentType];
}

export function isOwnedBlobUrl(value: unknown, purpose: "listing" | "profile", userId: string, mediaKind: MediaKind = "image") {
	if (typeof value !== "string" || value.length > 2048) return false;
	if (process.env.NODE_ENV === "development" && value.startsWith("/uploads/") && !value.startsWith("//")) {
		try {
			const url = new URL(value, "http://localhost");
			const pathname = decodeURIComponent(url.pathname);
			const extension = pathname.split("/").pop()?.split(".").pop()?.toLowerCase();
			const allowedExtensions: string[] = Object.values(MEDIA_CONTENT_TYPES[mediaKind]);
			const expectedPrefix = `/uploads/${purpose}/${userId}/`;
			const filename = pathname.slice(expectedPrefix.length);
			return url.origin === "http://localhost" && !url.search && !url.hash &&
				pathname.startsWith(expectedPrefix) && !pathname.includes("..") && !filename.includes("/") &&
				/^[\da-f-]{36}\.[a-z0-9]+$/i.test(filename) &&
				Boolean(extension && allowedExtensions.includes(extension));
		} catch {
			return false;
		}
	}
	try {
		const url = new URL(value);
		const pathname = decodeURIComponent(url.pathname);
		const extension = pathname.split("/").pop()?.split(".").pop()?.toLowerCase();
		const allowedExtensions: string[] = Object.values(MEDIA_CONTENT_TYPES[mediaKind]);
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
