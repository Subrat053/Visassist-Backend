const ROLES = [
  "super_admin",
  "admin",
  "documentation_executive",
  "support_executive",
  "destination_specialist",
  "adviser",
  "support",
];

const LEAD_STAGES = ["new", "contacted", "qualified", "converted", "lost"];

const CASE_STATUSES = [
  "new",
  "in_review",
  "biometrics",
  "interview",
  "rejected",
  "on_hold",
  "inquiry_received",
  "screening_pending",
  "documents_pending",
  "documents_received",
  "review_in_progress",
  "appointment_pending",
  "ready_for_submission",
  "submitted",
  "additional_docs_requested",
  "interview_scheduled",
  "decision_pending",
  "approved",
  "refused",
  "closed",
];

const PRIORITIES = ["low", "medium", "high", "critical", "urgent"];

const CHECKLIST_ITEM_STATUSES = ["pending", "received", "rejected"];

const APPOINTMENT_TYPES = [
  "consultation",
  "biometrics",
  "interview",
  "embassy",
  "document_review",
  "follow_up",
  "submission",
];
const APPOINTMENT_BOOKING_STATUSES = [
  "scheduled",
  "missed",
  "pending",
  "confirmed",
  "rescheduled",
  "completed",
  "cancelled",
];

const PAYMENT_STATUSES = ["pending", "partial", "paid", "failed", "refunded", "partially_refunded"];

const TEMPLATE_CHANNELS = ["email", "whatsapp", "reminder"];

const DOCUMENT_CATEGORIES = [
  "passport",
  "bank_statement",
  "sop",
  "loa",
  "visa_form",
  "photo",
  "id_proof",
  "employment",
  "education",
  "medical",
  "insurance",
  "other",
];

const DOCUMENT_VERIFICATION_STATUSES = ["pending", "approved", "rejected", "needs_resubmission"];

const COUNTRY_UPDATE_STATUSES = ["draft", "published", "archived"];

const AUDIT_ACTIONS = [
  "status_change",
  "payment_update",
  "file_upload",
  "assignment_change",
  "consent_recorded",
  "generic",
];

module.exports = {
  ROLES,
  LEAD_STAGES,
  CASE_STATUSES,
  PRIORITIES,
  CHECKLIST_ITEM_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_BOOKING_STATUSES,
  PAYMENT_STATUSES,
  TEMPLATE_CHANNELS,
  DOCUMENT_CATEGORIES,
  DOCUMENT_VERIFICATION_STATUSES,
  COUNTRY_UPDATE_STATUSES,
  AUDIT_ACTIONS,
};
