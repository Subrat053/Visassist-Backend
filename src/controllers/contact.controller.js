const ContactMessage = require("../models/ContactMessage.js");
const { sendAdminFormNotification } = require("../services/email");
const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");

const createContactMessage = asyncHandler(async (req, res) => {
  const item = await ContactMessage.create({
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone || "",
    subject: req.body.subject || "",
    message: req.body.message,
  });

  try {
    await sendAdminFormNotification({
      formType: "contact_message",
      data: {
        fullName: item.fullName,
        email: item.email,
        phone: item.phone,
        subject: item.subject,
        message: item.message,
        status: item.status,
      },
      record: item,
      meta: {
        sourceRoute: "/api/v1/contact",
        sourcePage: req.headers["x-page-path"] || "",
        replyTo: item.email,
      },
    });
  } catch (mailError) {
    console.error("[FORM_MAIL] Failed to send contact notification", {
      error: mailError.message,
      recordId: String(item._id),
    });
  }

  return sendSuccess(res, 201, item);
});

module.exports = { createContactMessage };
