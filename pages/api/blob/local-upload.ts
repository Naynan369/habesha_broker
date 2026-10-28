import { withSessionApi } from "@config/cookie/cookie";
import { mediaContentTypes, mediaExtension, type MediaKind } from "@libs/helpers/blob";
import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

class UploadTooLargeError extends Error {}

type UploadRequest = NextApiRequest & { user?: { id: string; verfied: boolean } };

async function readBody(req: NextApiRequest, limit: number) {
	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.length;
		if (size > limit) throw new UploadTooLargeError("The selected file is larger than the upload limit");
		chunks.push(buffer);
	}
	return Buffer.concat(chunks, size);
}

async function handler(req: UploadRequest, res: NextApiResponse) {
	if (process.env.NODE_ENV !== "development") return res.status(404).json({ err: "Not found" });
	if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });
	if (!req.user) return res.status(401).json({ err: "Authentication required" });

	const purpose = req.headers["x-upload-purpose"];
	const mediaKind = req.headers["x-upload-media-kind"];
	const itemType = req.headers["x-upload-item-type"];
	const contentType = String(req.headers["content-type"] || "").toLowerCase();
	if (purpose !== "listing" && purpose !== "profile") return res.status(400).json({ err: "Invalid upload purpose" });
	if (mediaKind !== "image" && mediaKind !== "video") return res.status(400).json({ err: "Invalid media type" });
	if (purpose === "listing" && !req.user.verfied) return res.status(403).json({ err: "Verify your email address first" });
	if (purpose === "listing" && !["HOUSE", "CAR", "BUSINESS_SPACE", "SERVICE"].includes(String(itemType))) return res.status(400).json({ err: "Choose a valid listing type" });
	if (purpose === "profile" && mediaKind !== "image") return res.status(400).json({ err: "Profile uploads must be images" });
	if (mediaKind === "video" && (purpose !== "listing" || itemType !== "HOUSE")) return res.status(400).json({ err: "Videos can only be added to home listings" });
	if (!mediaContentTypes(mediaKind as MediaKind).includes(contentType)) return res.status(400).json({ err: "Choose a JPEG, PNG, WebP, GIF, MP4, WebM, or MOV file" });

	try {
		const maxSize = purpose === "profile" ? 5 * 1024 * 1024 : mediaKind === "video" ? 25 * 1024 * 1024 : 8 * 1024 * 1024;
		const file = await readBody(req, maxSize);
		if (file.length === 0) return res.status(400).json({ err: "The selected file is empty" });
		const extension = mediaExtension(mediaKind as MediaKind, contentType);
		if (!extension) return res.status(400).json({ err: "Unsupported media type" });
		const filename = `${randomUUID()}.${extension}`;
		const directory = path.join(process.cwd(), "public", "uploads", purpose, req.user.id);
		await mkdir(directory, { recursive: true });
		await writeFile(path.join(directory, filename), file, { flag: "wx" });
		return res.status(200).json({ url: `/uploads/${purpose}/${req.user.id}/${filename}` });
	} catch (error) {
		if (error instanceof UploadTooLargeError) return res.status(413).json({ err: error.message });
		console.error("[uploads] Local media save failed", {
			code: error && typeof error === "object" && "code" in error ? error.code : undefined,
		});
		return res.status(500).json({ err: "Could not save the uploaded file. Please try again." });
	}
}

export const config = { api: { bodyParser: false } };
export default withSessionApi(handler);
