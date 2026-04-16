const NewsletterSubscriber = require("../models/NewsletterSubscriber.js");
const { sendAdminFormNotification } = require("../services/email");
const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");

const subscribeNewsletter = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();

  const subscriber = await NewsletterSubscriber.findOneAndUpdate(
    { email },
    { $set: { email, isActive: true } },
    { new: true, upsert: true }
  );

  try {
    await sendAdminFormNotification({
      formType: "newsletter_subscription",
      data: {
        email: subscriber.email,
        isActive: subscriber.isActive,
      },
      record: subscriber,
      meta: {
        sourceRoute: "/api/v1/newsletter/subscribe",
        sourcePage: req.headers["x-page-path"] || "",
        replyTo: subscriber.email,
      },
    });
  } catch (mailError) {
    console.error("[FORM_MAIL] Failed to send newsletter notification", {
      error: mailError.message,
      recordId: String(subscriber._id),
    });
  }

  return sendSuccess(res, 201, subscriber);
});

module.exports = { subscribeNewsletter };
