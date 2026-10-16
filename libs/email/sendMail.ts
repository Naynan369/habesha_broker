import * as nodemailer from "nodemailer";

export const sendMail = async (
	to: string,
	subject: string,
	html: string
) => {
	const user = process.env.MYEMAIL;
	const pass = process.env.MYPASS;

	const transponder = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user,
			pass,
		},
	});

	return transponder.sendMail(
		{
			from: user,
			to,
			subject,
			html,
		}
	);
};
