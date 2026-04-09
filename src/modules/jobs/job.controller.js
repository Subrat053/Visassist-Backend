const Job = require("../../models/Job");
const JobApplication = require("../../models/JobApplication");
const asyncHandler = require("../../utils/asyncHandler");
const uploadBufferToCloudinary = require("../../utils/cloudinaryUpload");

exports.getJobs = asyncHandler(async (req, res) => {
  const {
    country,
    profession,
    visa,
    keyword,
    page = 1,
    limit = 10,
  } = req.query;
  const query = {};

  if (country) query.country = country;
  if (profession) query.profession = profession;
  if (visa) query.visaType = visa;
  if (keyword) query.title = { $regex: keyword, $options: "i" };

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    Job.find(query).skip(skip).limit(Number(limit)),
    Job.countDocuments(query),
  ]);

  res.json({
    success: true,
    data,
    pagination: { total, page: Number(page), limit: Number(limit) },
  });
});

exports.getJobDetails = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  res.json({ success: true, data: job });
});

exports.applyToJob = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { code: "FILE_REQUIRED", message: "Resume file is required" },
    });
  }

  const uploadResult = await uploadBufferToCloudinary(
    req.file.buffer,
    "y-axis/resumes",
    "raw",
  );

  const application = await JobApplication.create({
    userId: req.user._id,
    jobId: req.params.jobId,
    resumeUrl: uploadResult.secure_url,
    resumePublicId: uploadResult.public_id,
    coverLetter: req.body.coverLetter,
    experience: req.body.experience,
  });

  res.status(201).json({
    success: true,
    message: "Application submitted",
    data: {
      applicationId: application._id,
      jobId: application.jobId,
      status: application.status,
      appliedDate: application.appliedDate,
    },
  });
});
