const { z } = require("zod");
const {
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  VISA_APPLICATION_STATUSES,
} = require("../services/visaPortal.service.js");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const stringArray = z.array(z.string()).optional();

const serviceHighlightSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  iconKey: z.string().optional(),
  sortOrder: z.number().optional(),
});

const requiredDocSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isMandatory: z.boolean().optional(),
  allowedFileTypes: stringArray,
  maxFiles: z.number().optional(),
  sortOrder: z.number().optional(),
});

const processSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
});

const timelineSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
});

const faqSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
  sortOrder: z.number().optional(),
});

const countryCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  code: z.string().optional(),
  flagImage: z.string().optional(),
  heroImage: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  region: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

const countryUpdateSchema = countryCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

const visaCategoryCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  iconKey: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const visaCategoryUpdateSchema = visaCategoryCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

const countryVisaTypeCreateSchema = z.object({
  countryId: objectId.optional(),
  countrySlug: z.string().optional(),
  countryName: z.string().optional(),
  visaCategoryId: objectId.optional(),
  visaTypeSlug: z.string().optional(),
  visaTypeName: z.string().optional(),
  title: z.string().optional(),
  badge: z.string().optional(),
  subtitle: z.string().optional(),
  heroImage: z.string().optional(),
  iconKey: z.string().optional(),
  overview: z.string().optional(),
  serviceHighlights: z.array(serviceHighlightSchema).optional(),
  eligibility: stringArray,
  requiredDocs: z.array(requiredDocSchema.or(z.string())).optional(),
  process: z.array(processSchema.or(z.string())).optional(),
  timeline: z.array(timelineSchema.or(z.string())).optional(),
  faqs: z.array(faqSchema).optional(),
  ctaTitle: z.string().optional(),
  ctaText: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  metaKeywords: stringArray,
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().optional(),
  applicationEnabled: z.boolean().optional(),
  consultationEnabled: z.boolean().optional(),
});

const countryVisaTypeUpdateSchema = countryVisaTypeCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

const countryVisaTypeStatusSchema = z
  .object({
    isActive: z.boolean().optional(),
    applicationEnabled: z.boolean().optional(),
    consultationEnabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one status field is required" });

const booleanLike = z.union([z.boolean(), z.string(), z.number()]).optional();

const publicApplicationSchema = z
  .object({
    countrySlug: z.string().optional(),
    country: z.string().optional(),
    visaTypeSlug: z.string().optional(),
    visaType: z.string().optional(),
    countryVisaTypeId: objectId.optional(),
    fullName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    nationality: z.string().optional(),
    applicantDetails: z.any().optional(),
    submittedDocs: z.any().optional(),
    consentAccepted: booleanLike,
    disclaimerAccepted: booleanLike,
    refundPolicyAccepted: booleanLike,
  })
  .passthrough();

const publicEnquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(3),
  countryOfInterest: z.string().optional(),
  visaInterestType: z.string().optional(),
  enquiryType: z.enum(ENQUIRY_TYPES).optional(),
  message: z.string().optional(),
  preferredContactMethod: z.string().optional(),
  pageSource: z.string().optional(),
});

const applicationStatusSchema = z.object({
  status: z.enum(VISA_APPLICATION_STATUSES),
  note: z.string().optional(),
  adminNotes: z.string().optional(),
});

const applicationNotesSchema = z.object({
  adminNotes: z.string().optional(),
});

const enquiryStatusSchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
  assignedTo: objectId.optional(),
});

const enquiryNotesSchema = z.object({
  adminNotes: z.string().optional(),
});

const ticketCreateSchema = z.object({
  applicationId: objectId.optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  subject: z.string().min(3),
  description: z.string().min(5),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assignedTo: objectId.optional(),
});

const ticketReplySchema = z.object({
  message: z.string().min(1),
});

const ticketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assignedTo: objectId.optional(),
});

const userStatusSchema = z
  .object({
    isActive: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
    role: z.string().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

module.exports = {
  countryCreateSchema,
  countryUpdateSchema,
  visaCategoryCreateSchema,
  visaCategoryUpdateSchema,
  countryVisaTypeCreateSchema,
  countryVisaTypeUpdateSchema,
  countryVisaTypeStatusSchema,
  publicApplicationSchema,
  publicEnquirySchema,
  applicationStatusSchema,
  applicationNotesSchema,
  enquiryStatusSchema,
  enquiryNotesSchema,
  ticketCreateSchema,
  ticketReplySchema,
  ticketStatusSchema,
  userStatusSchema,
};
