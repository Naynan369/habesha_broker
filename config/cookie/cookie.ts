import type { IUser } from "@libs/types/user";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import type { IncomingMessage } from "http";
import type {
	GetServerSideProps,
	GetServerSidePropsContext,
	NextApiHandler,
} from "next";

type SessionData = { user?: IUser };
type AppSession = IronSession<SessionData>;

declare module "http" {
	interface IncomingMessage {
		session: AppSession;
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
		return handler(req, res);
	};
};

export function withSessionSsr(
	handler: (context: GetServerSidePropsContext) => any
): GetServerSideProps<any> {
	return async (context) => {
		context.req.session = await getIronSession<SessionData>(context.req, context.res, getCookieConfig());
		return handler(context);
	};
}
