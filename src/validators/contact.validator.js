const { z } = require("zod");

const contactSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  subject: z.string().max(120).optional(),
  message: z.string().min(5).max(2000),
});

const newsletterSchema = z.object({
  email: z.string().email(),
});

module.exports = { contactSchema, newsletterSchema };
