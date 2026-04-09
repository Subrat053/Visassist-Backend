const { Router } = require("express");
const { getStudyCourses, getStudyDestinations, getUniversityById } = require("../controllers/study.controller.js");

const router = Router();

router.get("/destinations", getStudyDestinations);
router.get("/courses", getStudyCourses);
router.get("/universities/:universityId", getUniversityById);

module.exports = router;
