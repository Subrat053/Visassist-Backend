const Consultation = require("../models/Consultation.js");
const { sendAdminFormNotification } = require("../services/email");
const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");

const createConsultation = async (req, type) => {
  const consultation = await Consultation.create({
    user: req.user?._id,
    type,
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    countryOfInterest: req.body.countryOfInterest,
    message: req.body.message,
    details: req.body.details || {},
  });

  try {
    await sendAdminFormNotification({
      formType: `consultation_${type}`,
      data: {
        type,
        fullName: consultation.fullName,
        email: consultation.email,
        phone: consultation.phone,
        countryOfInterest: consultation.countryOfInterest,
        message: consultation.message,
        details: consultation.details,
        status: consultation.status,
      },
      record: consultation,
      meta: {
        sourceRoute: `/api/v1/consultations/${type}`,
        sourcePage: req.headers["x-page-path"] || "",
        replyTo: consultation.email,
      },
    });
  } catch (mailError) {
    console.error("[FORM_MAIL] Failed to send consultation notification", {
      error: mailError.message,
      recordId: String(consultation._id),
      type,
    });
  }

  return consultation;
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
