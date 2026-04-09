const { Router } = require("express");
const { getProfile, getUserApplicationById, listUserApplications, updateProfile, uploadApplicationDocument, } = require("../controllers/user.controller.js");
const { requireAuth } = require("../middlewares/auth.middleware.js");
const upload = require("../middlewares/upload.middleware.js");
const validate = require("../middlewares/validate.middleware.js");
const { updateProfileSchema } = require("../validators/user.validator.js");

const router = Router();

router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, validate(updateProfileSchema), updateProfile);
router.get("/applications", requireAuth, listUserApplications);
router.get("/applications/:applicationId", requireAuth, getUserApplicationById);
router.post(
  "/applications/:applicationId/documents",
  requireAuth,
  upload.single("file"),
  uploadApplicationDocument
);

module.exports = router;
