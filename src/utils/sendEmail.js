const { sendMail } = require("../services/email");

const sendEmail = async ({ to, subject, html, text, replyTo }) => {
	return sendMail({
		to,
		subject,
		html,
		text,
		replyTo,
	});
};

module.exports = { sendEmail };
