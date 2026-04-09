const { Router } = require("express");
const { applyToJob, getJobById, listJobs } = require("../controllers/job.controller.js");
const { requireAuth } = require("../middlewares/auth.middleware.js");
const validate = require("../middlewares/validate.middleware.js");
const { applyJobSchema } = require("../validators/job.validator.js");

const router = Router();

router.get("/", listJobs);
router.get("/:jobId", getJobById);
router.post("/:jobId/apply", requireAuth, validate(applyJobSchema), applyToJob);

module.exports = router;
