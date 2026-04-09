const { Router } = require("express");
const {
  createBlogPost,
  createCountry,
  createJob,
  deleteBlogPost,
  deleteCountry,
  deleteJob,
  getAdminStats,
  listBlogPostsAdmin,
  listConsultations,
  listCountriesAdmin,
  listJobsAdmin,
  listUsers,
  updateBlogPost,
  updateConsultationStatus,
  updateCountry,
  updateJob,
  updateUser,
} = require("../controllers/admin.controller.js");
const { requireAuth } = require("../middlewares/auth.middleware.js");
const { requireRoles } = require("../middlewares/role.middleware.js");

const router = Router();

router.use(requireAuth, requireRoles("admin"));

router.get("/stats", getAdminStats);

router.get("/users", listUsers);
router.patch("/users/:userId", updateUser);

router.get("/consultations", listConsultations);
router.patch("/consultations/:consultationId/status", updateConsultationStatus);

router.get("/countries", listCountriesAdmin);
router.post("/countries", createCountry);
router.put("/countries/:countryId", updateCountry);
router.delete("/countries/:countryId", deleteCountry);

router.get("/jobs", listJobsAdmin);
router.post("/jobs", createJob);
router.put("/jobs/:jobId", updateJob);
router.delete("/jobs/:jobId", deleteJob);

router.get("/blog-posts", listBlogPostsAdmin);
router.post("/blog-posts", createBlogPost);
router.put("/blog-posts/:postId", updateBlogPost);
router.delete("/blog-posts/:postId", deleteBlogPost);

module.exports = router;
