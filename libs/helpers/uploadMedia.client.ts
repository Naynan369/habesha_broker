import { upload } from "@vercel/blob/client";
import { isOwnedBlobUrl } from "@libs/helpers/blob";

type UploadPurpose = "listing" | "profile";
type MediaKind = "image" | "video";

function safeExtension(file: File) {
	const extensions: Record<string, string> = {
		"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
		"video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
	};
	return extensions[file.type] || "bin";
}

export async function uploadMediaFiles({
	files,
	userId,
	purpose,
	itemType,
	onProgress,
}: {
	files: Array<{ file: File; mediaKind: MediaKind }>;
	userId: string;
	purpose: UploadPurpose;
	itemType?: "HOUSE" | "CAR" | "BUSINESS_SPACE" | "SERVICE";
	onProgress?: (progress: number) => void;
}) {
	const totalBytes = files.reduce((sum, item) => sum + item.file.size, 0) || 1;
	let finishedBytes = 0;
	const urls: string[] = [];

	for (const { file, mediaKind } of files) {
		const pathname = `${purpose}/${userId}/${crypto.randomUUID()}.${safeExtension(file)}`;
		const blob = await upload(pathname, file, {
			access: "public",
			handleUploadUrl: "/api/blob/upload",
			contentType: file.type,
			clientPayload: JSON.stringify({ purpose, mediaKind, itemType, userId }),
			onUploadProgress: ({ loaded }) => {
				onProgress?.(Math.min(99, Math.round(((finishedBytes + loaded) / totalBytes) * 100)));
			},
		});
		finishedBytes += file.size;
		urls.push(blob.url);
		onProgress?.(Math.min(99, Math.round((finishedBytes / totalBytes) * 100)));
	}

	return urls;
}


export { isOwnedBlobUrl };
