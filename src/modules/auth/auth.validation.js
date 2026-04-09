const { z } = require("zod");

const signupSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  countryCode: z.string().optional(),
  state: z.string().optional(),
});

module.exports = { signupSchema };