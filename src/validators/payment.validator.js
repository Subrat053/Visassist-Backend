const { z } = require("zod");

const initiatePaymentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3).optional().default("usd"),
  purpose: z.enum(["consultation", "application", "service"]).optional().default("consultation"),
  metadata: z.record(z.string()).optional(),
});

module.exports = { initiatePaymentSchema };
