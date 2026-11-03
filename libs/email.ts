import * as nodemailer from "nodemailer";

function escapeHtml(value: string) {
	return value.replace(/[&<>"']/g, (character) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	})[character] || character);
}

export const getPasswordRestLink = (
	name: string,
	link: string,
	appLink?: string
) => `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172b33">
	<h1>Habesha Brokers</h1>
	<p>Hi ${escapeHtml(name)},</p>
	<p>We received a request to reset your password. Use this link within one hour:</p>
	<p><a href="${escapeHtml(link)}">Reset your password</a></p>
	${appLink ? `<p>If you use the Habesha Brokers app, you can also <a href="${escapeHtml(appLink)}">open the reset link in the app</a>.</p>` : ""}
	<p>If you did not request this change, you can ignore this email.</p>
</div>`;

export const getVerificationHtml = (
	name: string,
	code: string
) => `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172b33">
	<h1>Habesha Brokers</h1>
	<p>Hi ${escapeHtml(name)},</p>
	<p>Enter this code to verify your email address:</p>
	<p style="font-size: 28px; font-weight: bold; letter-spacing: 0.12em">${escapeHtml(code)}</p>
	<p>This code expires in 15 minutes. If you did not request it, you can ignore this email.</p>
</div>`;

export const sendMail = async (
	to: string,
	subject: string,
	html: string
) => {
	const user = process.env.MYEMAIL;
	const pass = process.env.MYPASS;
	if (!user || !pass) throw new Error("Email delivery is not configured");

	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: { user, pass },
	});

	return transporter.sendMail({ from: user, to, subject, html });
};
