const rateLimit = require("express-rate-limit");

const defaultHandler = {
  success: false,
  error: {
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again later.",
  },
};

const createRateLimiter = (windowMs, max, message = defaultHandler) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
  });
};

const authLimiter = createRateLimiter(15 * 60 * 1000, 10);
const consultationLimiter = createRateLimiter(10 * 60 * 1000, 12);
const contactLimiter = createRateLimiter(60 * 60 * 1000, 8);
const paymentLimiter = createRateLimiter(10 * 60 * 1000, 20);

module.exports = { authLimiter, consultationLimiter, contactLimiter, paymentLimiter, createRateLimiter };
