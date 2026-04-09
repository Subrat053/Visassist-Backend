const { z } = require("zod");

const eligibilitySchema = z.object({
  age: z.number().min(16).max(65),
  educationLevel: z.string().min(2),
  yearsOfExperience: z.number().min(0).max(45),
  englishScore: z.number().min(0).max(10),
  hasJobOffer: z.boolean().optional().default(false),
  hasFunds: z.boolean().optional().default(false),
  destination: z.string().min(2),
});

module.exports = { eligibilitySchema };
