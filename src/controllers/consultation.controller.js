const Consultation = require("../models/Consultation.js");
const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");

const createConsultation = async (req, type) => {
  return Consultation.create({
    user: req.user?._id,
    type,
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    countryOfInterest: req.body.countryOfInterest,
    message: req.body.message,
    details: req.body.details || {},
  });
};

const createMigrateConsultation = asyncHandler(async (req, res) => {
  const consultation = await createConsultation(req, "migrate");
  return sendSuccess(res, 201, consultation);
});

const createWorkConsultation = asyncHandler(async (req, res) => {
  const consultation = await createConsultation(req, "work");
  return sendSuccess(res, 201, consultation);
});

const createStudyConsultation = asyncHandler(async (req, res) => {
  const consultation = await createConsultation(req, "study");
  return sendSuccess(res, 201, consultation);
});

module.exports = { createMigrateConsultation, createWorkConsultation, createStudyConsultation };
