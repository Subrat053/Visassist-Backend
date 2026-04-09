const nodemailer = require("nodemailer");

const getTransport = () => {
	if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
		return null;
	}

	return nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT),
		secure: false,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});
};

const sendEmail = async ({ to, subject, html, text }) => {
	const transport = getTransport();

	if (!transport) {
		console.warn("SMTP is not configured. Email skipped.", { to, subject });
		return { accepted: [], rejected: [], skipped: true };
	}

	return transport.sendMail({
		from: process.env.EMAIL_FROM || process.env.SMTP_USER,
		to,
		subject,
		text,
		html,
	});
};
module.exports = { sendEmail };
