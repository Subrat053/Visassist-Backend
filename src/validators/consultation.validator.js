const { z } = require("zod");

const baseSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(20).optional(),
  countryOfInterest: z.string().min(2),
  message: z.string().max(1000).optional(),
  details: z.record(z.any()).optional(),
});

const migrateConsultationSchema = baseSchema;
const workConsultationSchema = baseSchema;
const studyConsultationSchema = baseSchema;

module.exports = { migrateConsultationSchema, workConsultationSchema, studyConsultationSchema };
