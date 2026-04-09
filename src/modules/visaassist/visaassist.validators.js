const { z } = require("zod");
const {
  LEAD_STAGES,
  CASE_STATUSES,
  CHECKLIST_ITEM_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_BOOKING_STATUSES,
  PAYMENT_STATUSES,
  TEMPLATE_CHANNELS,
} = require("../../utils/visaassist.constants.js");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20),
});

const staffForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const staffResetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number"),
});

const updateProfileSchema = z
  .object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    phone: z.string().min(6).max(20).optional(),
    avatarUrl: z.string().url().optional(),
    country: z.string().max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

const createLeadSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  countryCode: z.string().min(1).max(5),
  nationality: z.string().min(2).max(80),
  destinationCountry: z.string().min(2).max(80),
  visaCategory: z.string().min(2).max(80),
  travelPurpose: z.string().min(2).max(120),
  urgency: z.string().max(30).optional(),
  priorRefusal: z.boolean().optional(),
  notes: z.string().max(3000).optional(),
  source: z.string().max(80).optional(),
});

const assignLeadSchema = z.object({
  assignedTo: objectId,
});

const leadNoteSchema = z.object({
  note: z.string().min(2).max(2000),
});

const leadStageSchema = z.object({
  stage: z.enum(LEAD_STAGES),
});

const createCountrySchema = z.object({
  name: z.string().min(2).max(80),
  code: z.string().min(2).max(3),
  region: z.string().max(80).optional(),
  slug: z.string().max(80).optional(),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  isFeatured: z.boolean().optional(),
  ranking: z.number().int().min(0).optional(),
});

const createVisaCategorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().max(80).optional(),
  description: z.string().max(1200).optional(),
  travelPurpose: z.string().max(200).optional(),
  sopNotes: z.string().max(5000).optional(),
  processingGuidance: z.string().max(5000).optional(),
  isActive: z.boolean().optional(),
});

const createServicePackageSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().max(120).optional(),
  visaCategory: objectId,
  destinationCountry: z.string().min(2).max(80),
  description: z.string().max(2000).optional(),
  basePrice: z.number().min(0),
  currency: z.string().min(3).max(3).optional(),
  complexityPricing: z
    .array(
      z.object({
        level: z.string().min(1).max(50),
        multiplier: z.number().min(0.1).optional(),
        fixedAdjustment: z.number().optional(),
      })
    )
    .optional(),
  countryPricing: z
    .array(
      z.object({
        countryCode: z.string().min(2).max(3),
        price: z.number().min(0),
        currency: z.string().min(3).max(3).optional(),
      })
    )
    .optional(),
  isActive: z.boolean().optional(),
  sopNotes: z.string().max(5000).optional(),
  processingGuidance: z.string().max(5000).optional(),
});

const packageAvailabilitySchema = z.object({
  isActive: z.boolean(),
});

const createChecklistTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  destinationCountry: z.string().min(2).max(80),
  visaCategory: objectId,
  version: z.number().int().min(1).optional(),
  isActiveVersion: z.boolean().optional(),
  status: z.enum(["draft", "active", "inactive"]).optional(),
  changeSummary: z.string().max(300).optional(),
  items: z
    .array(
      z.object({
        key: z.string().min(2).max(80),
        label: z.string().min(2).max(200),
        description: z.string().max(1000).optional(),
        required: z.boolean().optional(),
        acceptedMimeTypes: z.array(z.string()).optional(),
        maxFileSizeMb: z.number().int().min(1).max(50).optional(),
      })
    )
    .min(1),
});

const generateChecklistSchema = z.object({
  templateId: objectId,
});

const updateChecklistItemSchema = z.object({
  status: z.enum(CHECKLIST_ITEM_STATUSES),
  remarks: z.string().max(1500).optional(),
  documentId: objectId.optional(),
});

const createApplicantSchema = z.object({
  leadId: objectId.optional(),
  markLeadConverted: z.boolean().optional(),
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  countryCode: z.string().min(1).max(5).optional(),
  nationality: z.string().min(2).max(80),
  passport: z
    .object({
      passportNumber: z.string().max(40).optional(),
      issueCountry: z.string().max(80).optional(),
      issueDate: z.string().datetime().optional(),
      expiryDate: z.string().datetime().optional(),
    })
    .optional(),
  basicProfile: z
    .object({
      dateOfBirth: z.string().datetime().optional(),
      maritalStatus: z.string().max(30).optional(),
      currentAddress: z.string().max(300).optional(),
      occupation: z.string().max(120).optional(),
    })
    .optional(),
  travelProfile: z
    .object({
      previousTravelCountries: z.array(z.string()).optional(),
      priorRefusal: z.boolean().optional(),
      refusalDetails: z.string().max(1000).optional(),
    })
    .optional(),
  familyInfo: z
    .object({
      spouseName: z.string().max(120).optional(),
      childrenCount: z.number().int().min(0).optional(),
    })
    .optional(),
  dependents: z
    .array(
      z.object({
        fullName: z.string().min(2).max(120),
        relation: z.string().min(2).max(40),
        dateOfBirth: z.string().datetime().optional(),
        passportNumber: z.string().max(40).optional(),
      })
    )
    .optional(),
  consentAccepted: z.boolean().optional(),
  disclaimerAccepted: z.boolean().optional(),
  refundPolicyAccepted: z.boolean().optional(),
});

const createCaseSchema = z.object({
  applicantId: objectId,
  leadId: objectId.optional(),
  additionalApplicantIds: z.array(objectId).optional(),
  destinationCountry: z.string().min(2).max(80),
  visaCategory: z.string().min(2).max(80),
  packageId: objectId.optional(),
  assignedStaff: z.array(objectId).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  caseStatus: z.enum(CASE_STATUSES).optional(),
});

const updateCaseStatusSchema = z.object({
  caseStatus: z.enum(CASE_STATUSES),
  note: z.string().max(1000).optional(),
});

const caseNoteSchema = z.object({
  message: z.string().min(2).max(3000),
  visibility: z.enum(["internal", "customer"]),
});

const assignCaseSchema = z.object({
  assignedStaff: z.array(objectId).min(1),
});

const createAppointmentSchema = z.object({
  caseId: objectId,
  applicantId: objectId,
  appointmentType: z.enum(APPOINTMENT_TYPES),
  appointmentDate: z.string().datetime(),
  appointmentTime: z.string().max(30).optional(),
  center: z.string().min(2).max(200),
  reference: z.string().max(120).optional(),
  bookingStatus: z.enum(APPOINTMENT_BOOKING_STATUSES).optional(),
  remarks: z.string().max(1500).optional(),
});

const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().datetime(),
  appointmentTime: z.string().max(30).optional(),
  reason: z.string().max(1000).optional(),
  remarks: z.string().max(1500).optional(),
});

const createInvoiceSchema = z.object({
  caseId: objectId,
  applicantId: objectId,
  leadId: objectId.optional(),
  packageId: objectId.optional(),
  currency: z.string().min(3).max(3).optional(),
  engagementTerms: z.string().max(8000).optional(),
  dueAt: z.string().datetime().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(2).max(300),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
        taxPercent: z.number().min(0).max(100).optional(),
      })
    )
    .min(1),
});

const recordPaymentSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().min(3).max(3).optional(),
  method: z.string().max(50).optional(),
  transactionReference: z.string().max(120).optional(),
  status: z.enum(PAYMENT_STATUSES),
  paidAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  gatewayResponse: z.record(z.string(), z.any()).optional(),
});

const createTemplateSchema = z.object({
  key: z.string().max(120).optional(),
  name: z.string().min(2).max(120),
  channel: z.enum(TEMPLATE_CHANNELS),
  subject: z.string().max(300).optional(),
  body: z.string().min(5),
  variables: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updateTemplateSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    channel: z.enum(TEMPLATE_CHANNELS).optional(),
    subject: z.string().max(300).optional(),
    body: z.string().min(5).optional(),
    variables: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

const createCountryProcessUpdateSchema = z.object({
  destinationCountry: z.string().min(2).max(80),
  title: z.string().min(2).max(200),
  advisory: z.string().min(10),
  effectiveDate: z.string().datetime(),
  version: z.number().int().min(1).optional(),
  isActiveVersion: z.boolean().optional(),
  internalNotes: z.string().max(5000).optional(),
  weekStart: z.string().datetime().optional(),
  weeklySummary: z.string().max(1000).optional(),
});

const recordConsentSchema = z.object({
  applicantId: objectId,
  caseId: objectId,
  consentType: z.enum(["consent", "disclaimer", "refund_policy", "reschedule_policy", "privacy_policy"]),
  accepted: z.boolean(),
  acceptedAt: z.string().datetime().optional(),
  source: z.enum(["web", "admin"]).optional(),
  textVersion: z.string().max(30).optional(),
});

module.exports = {
  staffLoginSchema,
  refreshTokenSchema,
  staffForgotPasswordSchema,
  staffResetPasswordSchema,
  updateProfileSchema,
  createLeadSchema,
  assignLeadSchema,
  leadNoteSchema,
  leadStageSchema,
  createCountrySchema,
  createVisaCategorySchema,
  createServicePackageSchema,
  packageAvailabilitySchema,
  createChecklistTemplateSchema,
  generateChecklistSchema,
  updateChecklistItemSchema,
  createApplicantSchema,
  createCaseSchema,
  updateCaseStatusSchema,
  caseNoteSchema,
  assignCaseSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  createInvoiceSchema,
  recordPaymentSchema,
  createTemplateSchema,
  updateTemplateSchema,
  createCountryProcessUpdateSchema,
  recordConsentSchema,
};
