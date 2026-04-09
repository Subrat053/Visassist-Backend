const { Router } = require("express");
const { forgotPasswordController, login, logout, refreshToken, resetPasswordController, signup, } = require("../controllers/auth.controller.js");
const { authLimiter } = require("../middlewares/rateLimit.middleware.js");
const validate = require("../middlewares/validate.middleware.js");
const { forgotPasswordSchema, loginSchema, refreshTokenSchema, resetPasswordSchema, signupSchema, } = require("../validators/auth.validator.js");

const router = Router();

router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", authLimiter, logout);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPasswordController);
router.post("/refresh-token", authLimiter, validate(refreshTokenSchema), refreshToken);

module.exports = router;
