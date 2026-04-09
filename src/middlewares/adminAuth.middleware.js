// backend/src/middlewares/adminAuth.middleware.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

exports.adminAuthVerify = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No token provided",
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password_hash");

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Admin not found",
        },
      });
    }

    if (admin.status !== "active") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Your account is not active",
        },
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid token",
      },
    });
  }
};

exports.adminPermissionCheck = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        },
      });
    }

    // Super admin has all permissions
    if (req.admin.role === "super_admin") {
      return next();
    }

    const hasPermission = requiredPermissions.every((permission) =>
      req.admin.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions for this action",
        },
      });
    }

    next();
  };
};

exports.adminRoleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        },
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "This action is restricted to specific roles",
        },
      });
    }

    next();
  };
};
