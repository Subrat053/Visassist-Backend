const { z } = require("zod");

const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().max(20).optional(),
  country: z.string().max(80).optional(),
  profile: z
    .object({
      dateOfBirth: z.string().optional(),
      educationLevel: z.string().optional(),
      yearsOfExperience: z.number().min(0).max(45).optional(),
      currentCountry: z.string().optional(),
      targetCountry: z.string().optional(),
    })
    .optional(),
});

module.exports = { updateProfileSchema };
