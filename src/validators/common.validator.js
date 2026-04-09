const { z } = require("zod");

const objectIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

module.exports = { objectIdSchema, paginationQuerySchema };
