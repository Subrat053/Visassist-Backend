const { z } = require("zod");

const stringArraySchema = z.array(z.string()).optional();

const serviceHighlightSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  iconKey: z.string().optional(),
});

const faqSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
});

const visaTypeCreateSchema = z.object({
  countrySlug: z.string().min(1),
  countryName: z.string().min(1),
  visaTypeSlug: z.string().min(1),
  visaTypeName: z.string().min(1),
  title: z.string().min(1),
  badge: z.string().optional(),
  subtitle: z.string().optional(),
  heroImage: z.string().optional(),
  iconKey: z.string().optional(),
  serviceHighlights: z.array(serviceHighlightSchema).optional(),
  eligibility: stringArraySchema,
  requiredDocs: stringArraySchema,
  process: stringArraySchema,
  timeline: stringArraySchema,
  faqs: z.array(faqSchema).optional(),
  ctaTitle: z.string().optional(),
  ctaText: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  metaKeywords: stringArraySchema,
});

const visaTypeUpdateSchema = visaTypeCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

const visaTypeToggleSchema = z.object({
  isActive: z.boolean().optional(),
});

module.exports = {
  visaTypeCreateSchema,
  visaTypeUpdateSchema,
  visaTypeToggleSchema,
};
