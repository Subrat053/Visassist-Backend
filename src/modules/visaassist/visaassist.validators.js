const { z } = require("zod");
const {
  LEAD_STAGES,
  CASE_STATUSES,
  CHECKLIST_ITEM_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_BOOKING_STATUSES,
  PAYMENT_STATUSES,
  TEMPLATE_CHANNELS,
  DOCUMENT_CATEGORIES,
  DOCUMENT_VERIFICATION_STATUSES,
  COUNTRY_UPDATE_STATUSES,
} = require("../../utils/visaassist.constants.js");

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
const TEMPLATE_TYPES = ["email", "whatsapp", "sms", "internal_note", "checklist_message"];

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
  priority: z.enum(["low", "medium", "high", "critical", "urgent"]).optional(),
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

const updateLeadSchema = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).max(20).optional(),
    nationality: z.string().min(2).max(80).optional(),
    destinationCountry: z.string().min(2).max(80).optional(),
    visaCategory: z.string().min(2).max(80).optional(),
    source: z.string().max(80).optional(),
    stage: z.enum(LEAD_STAGES).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

const convertLeadToApplicantSchema = z.object({
  markLeadConverted: z.boolean().optional(),
});

const convertLeadToCaseSchema = z.object({
  applicantId: objectId.optional(),
  destinationCountry: z.string().min(2).max(80).optional(),
  visaCategory: z.string().min(2).max(80).optional(),
  visaTypeSlug: z.string().max(120).optional(),
  priority: z.enum(["low", "medium", "high", "critical", "urgent"]).optional(),
  assignedStaff: z.array(objectId).optional(),
});

const updateApplicantSchema = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(6).max(20).optional(),
    nationality: z.string().min(2).max(80).optional(),
    profileStatus: z.enum(["draft", "submitted", "under_review", "approved", "rejected"]).optional(),
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
        occupation: z.string().max(120).optional(),
        education: z.string().max(200).optional(),
        annualIncome: z.number().min(0).optional(),
      })
      .optional(),
    travelProfile: z
      .object({
        previousTravelCountries: z.array(z.string()).optional(),
        priorRefusal: z.boolean().optional(),
        refusalDetails: z.string().max(1000).optional(),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

const updateCaseSchema = z
  .object({
    destinationCountry: z.string().min(2).max(80).optional(),
    visaCategory: z.string().min(2).max(80).optional(),
    caseStatus: z.enum(CASE_STATUSES).optional(),
    priority: z.enum(["low", "medium", "high", "critical", "urgent"]).optional(),
    assignedStaff: z.array(objectId).optional(),
    estimatedCompletionDate: z.string().datetime().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

const caseTimelineSchema = z.object({
  status: z.enum(CASE_STATUSES),
  note: z.string().min(2).max(1000),
});

const linkChecklistSchema = z.object({
  checklistId: objectId,
});

const linkServiceSchema = z.object({
  serviceId: objectId,
});

const createStaffSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(6).max(20).optional(),
  role: z.enum(["super_admin", "admin", "documentation_executive", "support_executive", "destination_specialist", "adviser", "support"]),
  isActive: z.boolean().optional(),
});

const updateStaffSchema = z
  .object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    phone: z.string().min(6).max(20).optional(),
    role: z.enum(["super_admin", "admin", "documentation_executive", "support_executive", "destination_specialist", "adviser", "support"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

const updateStaffStatusSchema = z.object({
  isActive: z.boolean(),
});

const uploadDocumentSchema = z.object({
  caseId: objectId,
  applicantId: objectId,
  leadId: objectId.optional(),
  category: z.enum(DOCUMENT_CATEGORIES).optional(),
  documentType: z.string().max(120).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  visibility: z.enum(["internal", "customer"]).optional(),
  accessLevel: z.enum(["internal", "customer_visible"]).optional(),
  checklistItemId: z.string().max(120).optional(),
});

const reviewDocumentSchema = z.object({
  verificationStatus: z.enum(DOCUMENT_VERIFICATION_STATUSES),
  verificationNote: z.string().max(1000).optional(),
});

const updateDocumentSchema = z
  .object({
    title: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    category: z.enum(DOCUMENT_CATEGORIES).optional(),
    visibility: z.enum(["internal", "customer"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

const updateAppointmentSchema = z
  .object({
    appointmentType: z.enum(APPOINTMENT_TYPES).optional(),
    appointmentDate: z.string().datetime().optional(),
    appointmentTime: z.string().max(30).optional(),
    center: z.string().min(2).max(200).optional(),
    reference: z.string().max(120).optional(),
    bookingStatus: z.enum(APPOINTMENT_BOOKING_STATUSES).optional(),
    remarks: z.string().max(1500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_BOOKING_STATUSES),
});

const createPaymentIntentSchema = z.object({
  caseId: objectId.optional(),
  applicantId: objectId.optional(),
  leadId: objectId.optional(),
  amount: z.number().min(1),
  currency: z.string().min(3).max(3).optional(),
  paymentType: z.string().max(60).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const createManualPaymentSchema = z.object({
  caseId: objectId.optional(),
  applicantId: objectId.optional(),
  leadId: objectId.optional(),
  amount: z.number().min(0),
  currency: z.string().min(3).max(3).optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  method: z.string().max(50).optional(),
  transactionReference: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
});

const updatePaymentStatusSchema = z.object({
  status: z.enum(PAYMENT_STATUSES),
});

const serviceSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().max(120).optional(),
  destinationCountry: z.string().min(2).max(80),
  visaCategory: z.string().min(2).max(120),
  visaTypeSlug: z.string().max(120).optional(),
  category: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().min(0).optional(),
  basePrice: z.number().min(0).optional(),
  currency: z.string().min(3).max(3).optional(),
  isActive: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

const updateServiceSchema = serviceSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

const checklistSchema = z.object({
  name: z.string().min(2).max(120),
  destinationCountry: z.string().min(2).max(80),
  visaCategory: z.string().min(2).max(120),
  visaTypeSlug: z.string().max(120).optional(),
  items: z
    .array(
      z.object({
        label: z.string().min(2).max(200),
        description: z.string().max(1000).optional(),
        required: z.boolean().optional(),
        documentCategory: z.enum(DOCUMENT_CATEGORIES).optional(),
        sortOrder: z.number().int().min(0).optional(),
      })
    )
    .optional(),
  isActive: z.boolean().optional(),
});

const updateChecklistSchema = checklistSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

const templateSchema = z.object({
  name: z.string().min(2).max(120),
  type: z.enum(TEMPLATE_TYPES),
  subject: z.string().max(300).optional(),
  body: z.string().min(2),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updateTemplateV2Schema = templateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

const templatePreviewSchema = z.object({
  variables: z.record(z.string(), z.string()).optional(),
});

const countryUpdateSchema = z.object({
  destinationCountry: z.string().min(2).max(80),
  visaCategory: z.string().max(120).optional(),
  title: z.string().min(2).max(200),
  summary: z.string().max(1000).optional(),
  content: z.string().min(5),
  effectiveDate: z.string().datetime().optional(),
  sourceUrl: z.string().url().optional(),
  status: z.enum(COUNTRY_UPDATE_STATUSES).optional(),
});

const updateCountryUpdateSchema = countryUpdateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

const settingPatchSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(2).max(120),
      value: z.any(),
      group: z.string().max(80).optional(),
    })
  ),
});

const publicEligibilitySchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  age: z.number().int().min(16).max(100).optional(),
  countryOfInterest: z.string().min(2).max(80),
  visaCategory: z.string().min(2).max(80),
  priorRefusal: z.boolean().optional(),
  coApplicantCount: z.number().int().min(0).optional(),
  message: z.string().max(2000).optional(),
  consentAccepted: z.boolean(),
});

const publicContactSchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  countryOfInterest: z.string().min(2).max(80),
  visaCategory: z.string().max(80).optional(),
  message: z.string().min(2).max(2000),
});

const publicApplicationSchema = z.object({
  country: z.string().min(2).max(80),
  visaType: z.string().min(2).max(120),
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  nationality: z.string().min(2).max(80).optional(),
  passport: z
    .object({
      passportNumber: z.string().max(40).optional(),
      issueCountry: z.string().max(80).optional(),
      issueDate: z.string().datetime().optional(),
      expiryDate: z.string().datetime().optional(),
    })
    .optional(),
  travelProfile: z
    .object({
      priorRefusal: z.boolean().optional(),
      refusalDetails: z.string().max(1000).optional(),
      previousTravelCountries: z.array(z.string()).optional(),
      previousVisaHistory: z.array(z.string()).optional(),
    })
    .optional(),
  occupation: z.string().max(120).optional(),
  uploadedFileRefs: z.array(z.string()).optional(),
  consentAccepted: z.boolean(),
  disclaimerAccepted: z.boolean(),
  refundPolicyAccepted: z.boolean(),
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
  updateLeadSchema,
  convertLeadToApplicantSchema,
  convertLeadToCaseSchema,
  updateApplicantSchema,
  updateCaseSchema,
  caseTimelineSchema,
  linkChecklistSchema,
  linkServiceSchema,
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  uploadDocumentSchema,
  reviewDocumentSchema,
  updateDocumentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  createPaymentIntentSchema,
  createManualPaymentSchema,
  updatePaymentStatusSchema,
  serviceSchema,
  updateServiceSchema,
  checklistSchema,
  updateChecklistSchema,
  templateSchema,
  updateTemplateV2Schema,
  templatePreviewSchema,
  countryUpdateSchema,
  updateCountryUpdateSchema,
  settingPatchSchema,
  publicEligibilitySchema,
  publicContactSchema,
  publicApplicationSchema,
};
