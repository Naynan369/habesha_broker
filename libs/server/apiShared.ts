import type { NextApiRequest, NextApiResponse } from "next";
import type { IUser } from "@libs/types/user";

export type SessionRequest = NextApiRequest & {
	user?: IUser;
	session: {
		userId?: string;
		sessionVersion?: number;
		oauthChallenges?: Partial<Record<"google" | "apple", { nonce: string; expiresAt: number }>>;
		save: () => Promise<void>;
		destroy: () => void;
	};
};

export const error = (res: NextApiResponse, status: number, err: string) =>
	res.status(status).json({ err });

export const isValidRecordId = (value: unknown): value is string =>
	typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(value);

export const sellerContactTypes = ["PHONE_NUMBER", "WHATSAPP", "TELEGRAM"] as const;

export async function currentUser(req: SessionRequest) {
	return req.user || null;
}

export async function requireUser(req: SessionRequest, res: NextApiResponse, verified = false) {
	const user = await currentUser(req);
	if (!user) {
		error(res, 401, "Authentication required");
		return null;
	}
	if (verified && !user.verfied) {
		error(res, 403, "Verify your email address first");
		return null;
	}
	return user;
}

export async function requireAdmin(req: SessionRequest, res: NextApiResponse) {
	const user = await requireUser(req, res);
	if (!user) return null;
	if (user.role !== "ADMIN") {
		error(res, 403, "Administrator access required");
		return null;
	}
	return user;
}

