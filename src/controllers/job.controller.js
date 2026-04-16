const Application = require("../models/Application.js");
const Job = require("../models/Job.js");
const { sendAdminFormNotification } = require("../services/email");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const { getPagination, getPaginationMeta } = require("../utils/pagination.js");

const listJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { country, employmentType, experienceLevel, featured, search } = req.query;

  const filter = {
    isActive: true,
  };

  if (country) {
    filter.country = country;
  }
  if (employmentType) {
    filter.employmentType = employmentType;
  }
  if (experienceLevel) {
    filter.experienceLevel = experienceLevel;
  }
  if (featured === "true") {
    filter.isFeatured = true;
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const [items, total] = await Promise.all([
    Job.find(filter)
      .populate("country", "name code")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

const getJobById = asyncHandler(async (req, res) => {
  const item = await Job.findById(req.params.jobId).populate("country", "name code");
  if (!item || !item.isActive) {
    throw new ApiError(404, "JOB_NOT_FOUND", "Job not found");
  }
  return sendSuccess(res, 200, item);
});

const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId).select("_id isActive title company country");
  if (!job || !job.isActive) {
    throw new ApiError(404, "JOB_NOT_FOUND", "Job not found");
  }

  const existing = await Application.findOne({ user: req.user._id, job: job._id });
  if (existing) {
    throw new ApiError(409, "ALREADY_APPLIED", "You have already applied for this job");
  }

  const application = await Application.create({
    user: req.user._id,
    job: job._id,
    coverLetter: req.body.coverLetter || "",
  });

  try {
    await sendAdminFormNotification({
      formType: "job_application",
      data: {
        fullName: req.user?.fullName || `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim(),
        email: req.user?.email || "",
        phone: req.user?.phone || "",
        jobTitle: job.title || "",
        company: job.company || "",
        country: job.country || "",
        coverLetter: application.coverLetter,
        status: application.status,
      },
      record: application,
      meta: {
        sourceRoute: `/api/v1/jobs/${req.params.jobId}/apply`,
        sourcePage: req.headers["x-page-path"] || "",
        recordId: application._id,
        replyTo: req.user?.email || undefined,
      },
    });
  } catch (mailError) {
    console.error("[FORM_MAIL] Failed to send job application notification", {
      error: mailError.message,
      recordId: String(application._id),
      jobId: String(job._id),
    });
  }

  return sendSuccess(res, 201, application);
});

module.exports = { listJobs, getJobById, applyToJob };
