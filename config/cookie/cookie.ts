import type { IUser } from "@libs/types/user";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import type { IncomingMessage } from "http";
import type {
	GetServerSideProps,
	GetServerSidePropsContext,
	NextApiHandler,
} from "next";
import { prisma } from "@config/prisma";

type SessionData = { userId?: string; sessionVersion?: number };
type AppSession = IronSession<SessionData>;

declare module "http" {
	interface IncomingMessage {
		session: AppSession;
		user?: IUser;
	}
}

function getCookieConfig(): SessionOptions {
	const password = process.env.COOKIE_PASSWORD;
	if (!password || password.length < 32) {
		throw new Error("COOKIE_PASSWORD must be set to at least 32 characters");
	}

	return {
		cookieName: "APP_SESSION",
		password,
		cookieOptions: {
			httpOnly: true,
			sameSite: "lax",
			path: "/",
			secure: process.env.NODE_ENV === "production",
		},
	};
}

export const withSessionApi = (handler: NextApiHandler): NextApiHandler => {
	return async (req, res) => {
		req.session = await getIronSession<SessionData>(req, res, getCookieConfig());
		await loadCurrentUser(req);
		return handler(req, res);
	};
};

export function withSessionSsr(
	handler: (context: GetServerSidePropsContext) => any
): GetServerSideProps<any> {
	return async (context) => {
		context.req.session = await getIronSession<SessionData>(context.req, context.res, getCookieConfig());
		await loadCurrentUser(context.req);
		return handler(context);
	};
}

async function loadCurrentUser(req: IncomingMessage) {
	const { userId, sessionVersion } = req.session;
	if (!userId || !Number.isInteger(sessionVersion)) {
		if (userId || sessionVersion !== undefined || (req.session as any).user) req.session.destroy();
		return;
	}
	const account = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true, firstName: true, lastName: true, email: true,
			bio: true, profile_url: true, role: true, verfied: true, sessionVersion: true,
		},
	});
	if (!account || account.sessionVersion !== sessionVersion) {
		req.session.destroy();
		return;
	}
	const { sessionVersion: _version, ...user } = account;
	req.user = user;
}
