const { Router } = require("express");
const adminRoutes = require("./admin.routes.js");
const assessmentRoutes = require("./assessment.routes.js");
const authRoutes = require("./auth.routes.js");
const blogRoutes = require("./blog.routes.js");
const consultationRoutes = require("./consultation.routes.js");
const contactRoutes = require("./contact.routes.js");
const countryRoutes = require("./country.routes.js");
const jobRoutes = require("./job.routes.js");
const newsletterRoutes = require("./newsletter.routes.js");
const paymentRoutes = require("./payment.routes.js");
const publicRoutes = require("./public.routes.js");
const studyRoutes = require("./study.routes.js");
const successStoryRoutes = require("./successStory.routes.js");
const userRoutes = require("./user.routes.js");
const visaassistRoutes = require("./visaassist.routes.js");

const router = Router();

router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/consultations", consultationRoutes);
router.use("/assessments", assessmentRoutes);
router.use("/countries", countryRoutes);
router.use("/jobs", jobRoutes);
router.use("/study", studyRoutes);
router.use("/blog", blogRoutes);
router.use("/contact", contactRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/user", userRoutes);
router.use("/payments", paymentRoutes);
router.use("/public", publicRoutes);
router.use("/success-stories", successStoryRoutes);
router.use("/visaassist", visaassistRoutes);

module.exports = router;
