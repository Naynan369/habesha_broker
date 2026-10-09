import { NextApiRequest } from "next";
import { IUser } from "./user";

export interface APIRequestWithUser extends NextApiRequest {
	user: IUser;
}

export interface ReqWithMultiFile extends NextApiRequest {
	user: IUser;
	files: Express.Multer.File[];
}

export interface ReqWithFile extends NextApiRequest {
	user: IUser;
	file: Express.Multer.File;
}
