const { Router } = require("express");
const {
	customerLogin,
	forgotPasswordController,
	login,
	logout,
	me,
	refreshToken,
	resetPasswordController,
	signup,
} = require("../controllers/auth.controller.js");
const { requireAuth } = require("../middlewares/auth.middleware.js");
const { authLimiter } = require("../middlewares/rateLimit.middleware.js");
const validate = require("../middlewares/validate.middleware.js");
const { forgotPasswordSchema, loginSchema, refreshTokenSchema, resetPasswordSchema, signupSchema, } = require("../validators/auth.validator.js");

const router = Router();

router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/customer-login", authLimiter, validate(loginSchema), customerLogin);
router.post("/logout", authLimiter, logout);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPasswordController);
router.post("/refresh-token", authLimiter, validate(refreshTokenSchema), refreshToken);
router.post("/refresh", authLimiter, validate(refreshTokenSchema), refreshToken);
router.get("/me", requireAuth, me);

module.exports = router;
