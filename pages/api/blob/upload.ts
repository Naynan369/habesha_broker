import { withSessionApi } from "@config/cookie/cookie";
import { mediaContentTypes, type MediaKind } from "@libs/helpers/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { NextApiRequest, NextApiResponse } from "next";

type UploadSessionRequest = NextApiRequest & {
	user?: { id: string; verfied: boolean };
};

async function handler(req: UploadSessionRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });
	const user = req.user;
	if (!user) return res.status(401).json({ err: "Authentication required" });
	if (!process.env.BLOB_READ_WRITE_TOKEN) {
		return res.status(503).json({ err: "Photo storage is not configured. Add BLOB_READ_WRITE_TOKEN to this environment and restart the app." });
	}

	try {
		const result = await handleUpload({
			request: req,
			body: req.body as HandleUploadBody,
			onBeforeGenerateToken: async (pathname, clientPayload) => {
				let payload: any;
				try { payload = JSON.parse(clientPayload || "{}"); } catch { throw new Error("Invalid upload details"); }
				const { purpose, mediaKind, itemType, userId } = payload;
				if (userId !== user.id || !["listing", "profile"].includes(purpose)) throw new Error("Upload is not allowed");
				if (purpose === "listing" && !user.verfied) throw new Error("Verify your email address first");
				if (purpose === "listing" && !["HOUSE", "CAR", "BUSINESS_SPACE", "SERVICE"].includes(itemType)) throw new Error("Choose a valid listing type");
				if (mediaKind !== "image" && mediaKind !== "video") throw new Error("Choose a valid media type");
				if (purpose === "profile" && mediaKind !== "image") throw new Error("Profile uploads must be images");
				if (mediaKind === "video" && (purpose !== "listing" || itemType !== "HOUSE")) throw new Error("Videos can only be added to home listings");
				const expectedPrefix = `${purpose}/${user.id}/`;
				if (!pathname.startsWith(expectedPrefix) || pathname.length > expectedPrefix.length + 100) throw new Error("Invalid upload path");
				// HEIC/HEIF files are converted to JPEG in the browser before direct upload.
				const allowedContentTypes = mediaContentTypes(mediaKind as MediaKind);
				return {
					allowedContentTypes,
					maximumSizeInBytes: purpose === "profile" ? 5 * 1024 * 1024 : mediaKind === "video" ? 25 * 1024 * 1024 : 8 * 1024 * 1024,
					addRandomSuffix: false,
					allowOverwrite: false,
					tokenPayload: JSON.stringify({ userId: user.id, purpose, mediaKind, itemType }),
				};
			},
		});
		return res.status(200).json(result);
	} catch (error: any) {
		const message = typeof error?.message === "string" ? error.message : "Unable to authorize upload";
		return res.status(400).json({ err: message.slice(0, 200) });
	}
}

export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };
export default withSessionApi(handler);
