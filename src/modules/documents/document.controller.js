const Document = require("../../models/Document");
const Application = require("../../models/Application");
const asyncHandler = require("../../utils/asyncHandler");
const uploadBufferToCloudinary = require("../../utils/cloudinaryUpload");

exports.uploadDocument = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.applicationId,
    userId: req.user._id,
  });

  if (!application) {
    return res.status(404).json({
      success: false,
      error: { code: "APPLICATION_NOT_FOUND", message: "Application not found" },
    });
  }

  const uploadResult = await uploadBufferToCloudinary(
    req.file.buffer,
    "y-axis/documents",
    "raw"
  );

  const document = await Document.create({
    applicationId: application._id,
    type: req.body.documentType,
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    uploadedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Document uploaded",
    data: {
      documentId: document._id,
      url: document.fileUrl,
      uploadedDate: document.createdAt,
    },
  });
});