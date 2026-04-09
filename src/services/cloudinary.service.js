const { uploadBufferToCloudinary } = require("../utils/cloudinaryUpload.js");

const RAW_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const uploadDocumentBuffer = async (fileBuffer, mimeType, folder = "y-axis/documents", options = {}) => {
  const resourceType = RAW_MIME_TYPES.has(mimeType) ? "raw" : "auto";
  const uploadOptions = {};

  if (options.deliveryType) {
    uploadOptions.type = options.deliveryType;
  }

  return uploadBufferToCloudinary(fileBuffer, folder, resourceType, uploadOptions);
};
module.exports = { uploadDocumentBuffer };
