const multer = require("multer");

const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error("Unsupported file type"));
        }
        return cb(null, true);
    },
});

module.exports = upload;
