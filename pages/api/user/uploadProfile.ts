import { prisma } from "@config/prisma";
import { withSessionApi } from "@config/cookie/cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

class ProfileUploadInputError extends Error {}

type SessionRequest = NextApiRequest & {
	session: { user?: { id: string; firstName: string; lastName: string; email: string; role?: "ADMIN" | "USER"; verfied: boolean; bio?: string }; save: () => Promise<void> };
	file?: Express.Multer.File;
};

const uploadDir = path.join(process.cwd(), "public", "profile");
const upload = multer({
	storage: multer.diskStorage({
		destination: (_req, _file, callback) => callback(null, uploadDir),
		filename: (_req, file, callback) => {
			const extension = {
				"image/jpeg": ".jpg",
				"image/png": ".png",
				"image/webp": ".webp",
				"image/gif": ".gif",
			}[file.mimetype] || ".img";
			callback(null, uuid() + extension);
		},
	}),
	fileFilter: (_req, file, callback) => {
		if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
			return callback(new ProfileUploadInputError("Use a JPEG, PNG, WebP, or GIF image"));
		}
		callback(null, true);
	},
	limits: { files: 1, fileSize: 5 * 1024 * 1024 },
}).single("image");

function handleUpload(req: any, res: any) {
	return new Promise<void>((resolve, reject) => {
		upload(req, res, (err: any) => (err ? reject(err) : resolve()));
	});
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
	const sessionReq = req as SessionRequest;
	if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });
	const user = sessionReq.session?.user;
	if (!user) return res.status(401).json({ err: "Authentication required" });
	let profileSaved = false;
	try {
		fs.mkdirSync(uploadDir, { recursive: true });
		await handleUpload(req, res);
		if (!sessionReq.file) return res.status(400).json({ err: "Choose an image to upload" });
		const updated = await prisma.user.update({
			where: { id: user.id },
			data: { profile_url: sessionReq.file.filename },
			select: {
				id: true, firstName: true, lastName: true, email: true,
				bio: true, profile_url: true, role: true, verfied: true,
			},
		});
		profileSaved = true;
		sessionReq.session.user = updated;
		await sessionReq.session.save();
		return res.status(200).json({ user: updated });
	} catch (err: any) {
		if (!profileSaved && sessionReq.file?.path) {
			try { fs.unlinkSync(sessionReq.file.path); } catch (_cleanupError) {}
		}
		const isUploadInputError = err instanceof ProfileUploadInputError;
		const isMulterError = err instanceof multer.MulterError;
		const status = isUploadInputError ? 400 : isMulterError ? (err.code === "LIMIT_FILE_SIZE" ? 413 : 400) : 500;
		const message = status >= 500 ? "Unable to save the profile image. Please try again." : err?.message || "Unable to upload profile image";
		return res.status(status).json({ err: message });
	}
}

export const config = { api: { bodyParser: false } };
export default withSessionApi(handler);

