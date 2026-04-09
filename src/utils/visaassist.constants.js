const ROLES = [
  "super_admin",
  "admin",
  "documentation_executive",
  "support_executive",
  "destination_specialist",
];

const LEAD_STAGES = ["new", "contacted", "qualified", "converted", "lost"];

const CASE_STATUSES = [
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

const PRIORITIES = ["low", "medium", "high", "critical"];

const CHECKLIST_ITEM_STATUSES = ["pending", "received", "rejected"];

const APPOINTMENT_TYPES = ["biometrics", "submission", "interview", "embassy"];
const APPOINTMENT_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "rescheduled",
  "completed",
  "cancelled",
];

const PAYMENT_STATUSES = ["pending", "partial", "paid", "refunded"];

const TEMPLATE_CHANNELS = ["email", "whatsapp", "reminder"];

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
  AUDIT_ACTIONS,
};
