import { sendMail } from "@libs/email/sendMail";
import { getVerificationHtml } from "@libs/email/verification";
import { prisma } from "@config/prisma";
import { IUser } from "@libs/types/user";
import { User } from "@prisma/client";
import { FilterState } from "@libs/store/useFilter";

export const sendVerificationEmail = async (user: IUser) => {
	const code = Math.floor(Math.random() * (99999 - 10000)) + 10000;
	const old = await prisma.verification.findFirst({
		where: {
			userId: user.id,
		},
	});

	if (old) {
		return await prisma.verification
			.update({
				where: {
					id: old.id,
				},
				data: {
					code: code.toString(),
				},
			})
			.then(() => {
				sendMail(
					user.email,
					"Verify your Email",
					getVerificationHtml(user.firstName, code.toString())
				);
			});
	} else {
		return await prisma.verification
			.create({
				data: {
					code: code.toString(),
					userId: user.id,
				},
			})
			.then(() => {
				sendMail(
					user.email,
					"Verify your Email",
					getVerificationHtml(user.firstName, code.toString())
				);
			});
	}
};

export const removePasswordFromInfo = (user: User) => {
	const { password, ...info } = user;
	return info;
};

export const getBaseUrl = () =>
	process.env.NODE_ENV === "development"
		? "http://localhost:3000"
		: process.env.DOMAIN;
