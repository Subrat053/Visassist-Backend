const ContactMessage = require("../models/ContactMessage.js");
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

  return sendSuccess(res, 201, item);
});

module.exports = { createContactMessage };
