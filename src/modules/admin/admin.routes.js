// backend/src/modules/admin/admin.routes.js
const express = require("express");
const router = express.Router();
const {
  adminAuthVerify,
  adminPermissionCheck,
  adminRoleCheck,
} = require("../../middlewares/adminAuth.middleware");
const { auditLogMiddleware } = require("../../middlewares/auditLog.middleware");
const authController = require("./admin.auth.controller");
const adminController = require("./admin.controller");

// Apply audit logging to all admin routes
router.use(auditLogMiddleware);

// ======================== AUTHENTICATION ROUTES ========================
router.post("/auth/login", authController.adminLogin);
router.post("/auth/logout", adminAuthVerify, authController.adminLogout);
router.post("/auth/refresh", authController.refreshToken);
router.post(
  "/auth/change-password",
  adminAuthVerify,
  authController.changePassword
);

// ======================== PROTECTED ROUTES ========================

// Dashboard
router.get("/dashboard", adminAuthVerify, adminController.getDashboard);
router.get("/analytics", adminAuthVerify, adminController.getAnalytics);

// Users Management
router.get(
  "/users",
  adminAuthVerify,
  adminPermissionCheck("users.view"),
  adminController.getAllUsers
);
router.get(
  "/users/:userId",
  adminAuthVerify,
  adminPermissionCheck("users.view"),
  adminController.getUserDetails
);
router.put(
  "/users/:userId/status",
  adminAuthVerify,
  adminPermissionCheck("users.edit"),
  adminController.updateUserStatus
);

// Consultation Management
router.get(
  "/consultations",
  adminAuthVerify,
  adminPermissionCheck("consultations.view"),
  adminController.getAllConsultations
);
router.get(
  "/consultations/:consultationId",
  adminAuthVerify,
  adminPermissionCheck("consultations.view"),
  adminController.getConsultationDetails
);
router.put(
  "/consultations/:consultationId/status",
  adminAuthVerify,
  adminPermissionCheck("consultations.update_status"),
  adminController.updateConsultationStatus
);
router.put(
  "/consultations/:consultationId/assign",
  adminAuthVerify,
  adminPermissionCheck("consultations.assign"),
  adminController.assignConsultant
);

// Reports
router.get(
  "/reports/revenue",
  adminAuthVerify,
  adminPermissionCheck("reports.view"),
  adminController.getRevenueReport
);

// Audit Logs
router.get(
  "/audit-logs",
  adminAuthVerify,
  adminPermissionCheck("audit.view"),
  adminController.getAuditLogs
);

// Content Management (Countries, Jobs, Courses, Blog)
// router.use("/countries", require("./admin.content.routes"));
// router.use("/jobs", require("./admin.jobs.routes"));
// router.use("/courses", require("./admin.courses.routes"));
// router.use("/blog", require("./admin.blog.routes"));

// Admin Management (Super Admin only)
// router.use(
//   "/admins",
//   adminAuthVerify,
//   adminRoleCheck("super_admin"),
//   require("./admin.admins.routes")
// );

module.exports = router;
