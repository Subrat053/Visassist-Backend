const express = require("express");
const router = express.Router();
const controller = require("./job.controller");
const { protect } = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/upload.middleware");

router.get("/", controller.getJobs);
router.get("/:jobId", controller.getJobDetails);
router.post("/:jobId/apply", protect, upload.single("resume"), controller.applyToJob);

module.exports = router;