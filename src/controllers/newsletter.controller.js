const NewsletterSubscriber = require("../models/NewsletterSubscriber.js");
const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");

const subscribeNewsletter = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();

  const subscriber = await NewsletterSubscriber.findOneAndUpdate(
    { email },
    { $set: { email, isActive: true } },
    { new: true, upsert: true }
  );

  return sendSuccess(res, 201, subscriber);
});

module.exports = { subscribeNewsletter };
