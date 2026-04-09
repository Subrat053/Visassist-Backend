const Assessment = require("../models/Assessment.js");
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

  return sendSuccess(res, 201, {
    assessmentId: assessment._id,
    ...result,
  });
});

module.exports = { assessEligibility };
