// backend/src/modules/admin/admin.auth.controller.js
const Admin = require("../../models/Admin");
const jwt = require("jsonwebtoken");

const generateTokens = (adminId) => {
  const accessToken = jwt.sign(
    { id: adminId },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: adminId },
    process.env.JWT_REFRESH_SECRET || "your_refresh_secret",
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
        },
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email, isDeleted: false }).select(
      "+password_hash"
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    // Check if account is locked
    if (admin.isAccountLocked()) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCOUNT_LOCKED",
          message: "Your account is locked. Please try again later.",
        },
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      await admin.incLoginAttempts();

      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0 || admin.lockedUntil) {
      await admin.resetLoginAttempts();
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(admin._id);

    // Remove password from response
    admin.password_hash = undefined;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        admin: {
          adminId: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
        },
        token: accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "LOGIN_ERROR",
        message: error.message,
      },
    });
  }
};

exports.adminLogout = async (req, res) => {
  try {
    // In a real scenario, you might want to blacklist the token
    // For now, we just return a success response
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "LOGOUT_ERROR",
        message: error.message,
      },
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Refresh token is required",
        },
      });
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || "your_refresh_secret"
      );

      const admin = await Admin.findById(decoded.id);

      if (!admin || admin.status !== "active") {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Admin not found or not active",
          },
        });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(
        admin._id
      );

      res.status(200).json({
        success: true,
        data: {
          token: accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid refresh token",
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "TOKEN_REFRESH_ERROR",
        message: error.message,
      },
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "All fields are required",
        },
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Passwords do not match",
        },
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 6 characters",
        },
      });
    }

    const admin = await Admin.findById(req.admin._id).select("+password_hash");

    const isPasswordValid = await admin.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_PASSWORD",
          message: "Current password is incorrect",
        },
      });
    }

    admin.password_hash = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "PASSWORD_CHANGE_ERROR",
        message: error.message,
      },
    });
  }
};

module.exports = exports;
