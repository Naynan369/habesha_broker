import * as nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export const sendMail = async (
	to: string,
	subject: string,
	html: string,
	callback?: (err: Error, info: SMTPTransport.SentMessageInfo) => any
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
		},
		callback
	);
};
