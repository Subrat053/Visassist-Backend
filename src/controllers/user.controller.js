const Application = require("../models/Application.js");
const Document = require("../models/Document.js");
const User = require("../models/User.js");
const { uploadDocumentBuffer } = require("../services/cloudinary.service.js");
const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/ApiError.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const { getPagination, getPaginationMeta } = require("../utils/pagination.js");

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  return sendSuccess(res, 200, user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};

  if (typeof req.body.firstName !== "undefined") {
    updates.firstName = req.body.firstName;
  }
  if (typeof req.body.lastName !== "undefined") {
    updates.lastName = req.body.lastName;
  }
  if (typeof req.body.phone !== "undefined") {
    updates.phone = req.body.phone;
  }
  if (typeof req.body.country !== "undefined") {
    updates.country = req.body.country;
  }
  if (typeof req.body.profile !== "undefined") {
    updates.profile = req.body.profile;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  return sendSuccess(res, 200, user);
});

const listUserApplications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [items, total] = await Promise.all([
    Application.find({ user: req.user._id })
      .populate("job", "title company")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Application.countDocuments({ user: req.user._id }),
  ]);

  return sendSuccess(res, 200, {
    items,
    pagination: getPaginationMeta(page, limit, total),
  });
});

const getUserApplicationById = asyncHandler(async (req, res) => {
  const item = await Application.findOne({
    _id: req.params.applicationId,
    user: req.user._id,
  }).populate("job", "title company description");

  if (!item) {
    throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found");
  }

  const documents = await Document.find({ application: item._id }).sort({ createdAt: -1 });

  return sendSuccess(res, 200, {
    application: item,
    documents,
  });
});

const uploadApplicationDocument = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.applicationId,
    user: req.user._id,
  });

  if (!application) {
    throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found");
  }

  if (!req.file) {
    throw new ApiError(400, "FILE_REQUIRED", "A file is required");
  }

  const uploadResult = await uploadDocumentBuffer(
    req.file.buffer,
    req.file.mimetype,
    `y-axis/users/${req.user._id}/applications/${application._id}`
  );

  const document = await Document.create({
    application: application._id,
    user: req.user._id,
    documentType: req.body.documentType || "other",
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    status: "pending",
    remarks: "",
  });

  return sendSuccess(res, 201, document);
});

module.exports = { getProfile, updateProfile, listUserApplications, getUserApplicationById, uploadApplicationDocument };
