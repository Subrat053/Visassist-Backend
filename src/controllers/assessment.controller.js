const Assessment = require("../models/Assessment.js");
const { sendAdminFormNotification } = require("../services/email");
const { evaluateEligibility } = require("../services/assessment.service.js");
const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");

const assessEligibility = asyncHandler(async (req, res) => {
  const result = evaluateEligibility(req.body);

  const assessment = await Assessment.create({
    user: req.user?._id,
    input: req.body,
    score: result.score,
    recommendation: result.recommendation,
    breakdown: result.breakdown,
  });

  try {
    await sendAdminFormNotification({
      formType: "assessment_eligibility",
      data: {
        ...req.body,
        score: result.score,
        recommendation: result.recommendation,
        breakdown: result.breakdown,
      },
      record: assessment,
      meta: {
        sourceRoute: "/api/v1/assessments/eligibility",
        sourcePage: req.headers["x-page-path"] || "",
      },
    });
  } catch (mailError) {
    console.error("[FORM_MAIL] Failed to send assessment notification", {
      error: mailError.message,
      recordId: String(assessment._id),
    });
  }

  return sendSuccess(res, 201, {
    assessmentId: assessment._id,
    ...result,
  });
});

module.exports = { assessEligibility };
