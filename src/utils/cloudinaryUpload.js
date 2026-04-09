const cloudinary = require("../config/cloudinary.js");

const uploadBufferToCloudinary = (buffer, folder, resourceType = "auto", uploadOptions = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...uploadOptions,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

module.exports = { uploadBufferToCloudinary };
