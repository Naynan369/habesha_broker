import { prisma } from "@config/prisma";
import { withSessionApi } from "@config/cookie/cookie";
import { isOwnedBlobUrl } from "@libs/helpers/blob";
import type { NextApiRequest, NextApiResponse } from "next";

type ProfileRequest = NextApiRequest & { user?: { id: string } };

async function handler(req: ProfileRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });
	if (!req.user) return res.status(401).json({ err: "Authentication required" });
	const url = req.body?.url;
	if (!isOwnedBlobUrl(url, "profile", req.user.id)) return res.status(400).json({ err: "Choose a valid profile image upload" });

	try {
		const user = await prisma.user.update({
			where: { id: req.user.id },
			data: { profile_url: url },
			select: { id: true, firstName: true, lastName: true, email: true, bio: true, profile_url: true, role: true, verfied: true },
		});
		return res.status(200).json({ user });
	} catch {
		return res.status(500).json({ err: "Unable to save the profile image. Please try again." });
	}
}

export default withSessionApi(handler);
