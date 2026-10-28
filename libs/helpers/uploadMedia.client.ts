import { upload } from "@vercel/blob/client";
import { isOwnedBlobUrl, mediaExtension, type MediaKind } from "@libs/helpers/blob";

type UploadPurpose = "listing" | "profile";

function uploadLocally({
	file,
	purpose,
	mediaKind,
	itemType,
	onProgress,
}: {
	file: File;
	purpose: UploadPurpose;
	mediaKind: MediaKind;
	itemType?: "HOUSE" | "CAR" | "BUSINESS_SPACE" | "SERVICE";
	onProgress: (loaded: number) => void;
}) {
	return new Promise<string>((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.open("POST", "/api/blob/local-upload");
		request.setRequestHeader("Content-Type", file.type);
		request.setRequestHeader("X-Upload-Purpose", purpose);
		request.setRequestHeader("X-Upload-Media-Kind", mediaKind);
		if (itemType) request.setRequestHeader("X-Upload-Item-Type", itemType);
		request.upload.onprogress = (event) => {
			if (event.lengthComputable) onProgress(event.loaded);
		};
		request.onerror = () => reject(new Error("The local upload could not reach the server"));
		request.onload = () => {
			let result: { url?: string; err?: string } = {};
			try { result = JSON.parse(request.responseText); } catch {}
			if (request.status < 200 || request.status >= 300 || !result.url) {
				reject(new Error(result.err || "The local upload failed"));
				return;
			}
			resolve(result.url);
		};
		request.send(file);
	});
}

function safeExtension(file: File, mediaKind: MediaKind) {
	return mediaExtension(mediaKind, file.type) || "bin";
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
		if (process.env.NODE_ENV === "development") {
			const url = await uploadLocally({
				file,
				purpose,
				mediaKind,
				itemType,
				onProgress: (loaded) => onProgress?.(Math.min(99, Math.round(((finishedBytes + loaded) / totalBytes) * 100))),
			});
			finishedBytes += file.size;
			urls.push(url);
			onProgress?.(Math.min(99, Math.round((finishedBytes / totalBytes) * 100)));
			continue;
		}

		const pathname = `${purpose}/${userId}/${crypto.randomUUID()}.${safeExtension(file, mediaKind)}`;
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
