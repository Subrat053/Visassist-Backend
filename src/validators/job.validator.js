const { z } = require("zod");

const applyJobSchema = z.object({
  coverLetter: z.string().max(3000).optional(),
});

module.exports = { applyJobSchema };
