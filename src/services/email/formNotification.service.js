const { buildFormSubmissionTemplate } = require("./templates.js");
const { getMailRuntimeConfig, sendMail } = require("./transporter.js");

const FORM_MAIL_LOG_TAG = "[FORM_MAIL]";

const FIELD_LABELS = {
  firstName: "First Name",
  lastName: "Last Name",
  fullName: "Full Name",
  name: "Name",
  email: "Email Address",
  phone: "Phone Number",
  whatsappNumber: "WhatsApp Number",
  country: "Country",
  countryOfInterest: "Country of Interest",
  visaType: "Visa Type",
  visaCategory: "Visa Category",
  visaInterestType: "Visa Interest Type",
  visaTypeSlug: "Visa Type Slug",
  serviceType: "Service Type",
  message: "Message",
  age: "Age",
  education: "Education",
  educationLevel: "Education Level",
  yearsOfExperience: "Years Of Experience",
  englishScore: "English Score",
  travelHistory: "Travel History",
  priorRefusal: "Prior Refusal",
  coApplicant: "Co-Applicant",
  coApplicantCount: "Number Of Co-Applicants",
  preferredDate: "Preferred Date",
  preferredTime: "Preferred Time",
  occupation: "Occupation",
  budget: "Budget",
  nationality: "Nationality",
  passportNumber: "Passport Number",
  currentLocation: "Current Location",
  destination: "Destination",
  destinationCountry: "Destination Country",
  enquiryType: "Enquiry Type",
  preferredContactMethod: "Preferred Contact Method",
  pageSource: "Page Source",
  source: "Source",
  subject: "Subject",
  coverLetter: "Cover Letter",
  status: "Status",
  applicationNumber: "Application Number",
  enquiryNumber: "Enquiry Number",
  ticketNumber: "Ticket Number",
  category: "Category",
  description: "Description",
  priority: "Priority",
  consentAccepted: "Consent Accepted",
  disclaimerAccepted: "Disclaimer Accepted",
  refundPolicyAccepted: "Refund Policy Accepted",
  hasJobOffer: "Has Job Offer",
  hasFunds: "Has Funds",
  countrySlug: "Country Slug",
  countryVisaTypeId: "Country Visa Type",
  "applicantDetails.firstName": "First Name",
  "applicantDetails.lastName": "Last Name",
  "applicantDetails.email": "Email Address",
  "applicantDetails.phone": "Phone Number",
  "applicantDetails.nationality": "Nationality",
  "applicantDetails.passportNumber": "Passport Number",
  "applicantDetails.maritalStatus": "Marital Status",
  "applicantDetails.gender": "Gender",
  "applicantDetails.dob": "Date Of Birth",
  "applicantDetails.travelDate": "Travel Date",
  "applicantDetails.address": "Address",
  "travelProfile.priorRefusal": "Prior Refusal",
  "travelProfile.refusalDetails": "Refusal Details",
};

const FORM_LABELS = {
  contact_message: "Contact Us Form",
  consultation_migrate: "Migrate Consultation",
  consultation_work: "Work Consultation",
  consultation_study: "Study Consultation",
  assessment_eligibility: "Eligibility Assessment",
  newsletter_subscription: "Newsletter Subscription",
  job_application: "Job Application",
  public_enquiry: "Public Enquiry",
  visa_application: "Visa Application",
  public_eligibility: "Public Eligibility Check",
  public_contact: "Public Contact Form",
  public_application_legacy: "Public Application (Legacy)",
  public_lead_capture: "Public Lead Capture",
  user_support_ticket: "Support Ticket",
};

const FORM_FIELD_PRIORITY = {
  contact_message: ["fullName", "email", "phone", "subject", "message", "status"],
  consultation_migrate: ["fullName", "email", "phone", "countryOfInterest", "message", "type", "status"],
  consultation_work: ["fullName", "email", "phone", "countryOfInterest", "message", "type", "status"],
  consultation_study: ["fullName", "email", "phone", "countryOfInterest", "message", "type", "status"],
  assessment_eligibility: [
    "age",
    "educationLevel",
    "yearsOfExperience",
    "englishScore",
    "hasJobOffer",
    "hasFunds",
    "destination",
    "score",
    "recommendation",
  ],
  newsletter_subscription: ["email", "isActive"],
  job_application: ["fullName", "email", "phone", "jobTitle", "company", "country", "coverLetter", "status"],
  public_enquiry: [
    "name",
    "email",
    "phone",
    "countryOfInterest",
    "visaInterestType",
    "enquiryType",
    "preferredContactMethod",
    "pageSource",
    "message",
    "status",
  ],
  visa_application: [
    "applicationNumber",
    "countrySlug",
    "visaTypeSlug",
    "status",
    "applicantDetails.firstName",
    "applicantDetails.lastName",
    "applicantDetails.email",
    "applicantDetails.phone",
    "applicantDetails.nationality",
    "applicantDetails.passportNumber",
    "applicantDetails.dob",
    "applicantDetails.travelDate",
    "consentAccepted",
    "disclaimerAccepted",
    "refundPolicyAccepted",
  ],
  public_eligibility: [
    "firstName",
    "lastName",
    "email",
    "phone",
    "countryOfInterest",
    "visaCategory",
    "age",
    "priorRefusal",
    "coApplicantCount",
    "message",
    "consentAccepted",
  ],
  public_contact: [
    "firstName",
    "lastName",
    "email",
    "phone",
    "countryOfInterest",
    "visaCategory",
    "message",
  ],
  public_application_legacy: [
    "firstName",
    "lastName",
    "email",
    "phone",
    "country",
    "visaType",
    "nationality",
    "occupation",
    "travelProfile.priorRefusal",
    "travelProfile.refusalDetails",
    "consentAccepted",
    "disclaimerAccepted",
    "refundPolicyAccepted",
  ],
  public_lead_capture: [
    "fullName",
    "email",
    "phone",
    "destinationCountry",
    "visaCategory",
    "source",
    "priorRefusal",
    "notes",
  ],
  user_support_ticket: [
    "ticketNumber",
    "subject",
    "description",
    "category",
    "priority",
    "status",
    "applicationNumber",
    "email",
    "phone",
  ],
};

const EXCLUDED_FIELD_PATTERNS = [/^__v$/i, /^password$/i, /token/i, /secret/i, /authorization/i, /otp/i, /^salt$/i];

const MASKED_FIELD_PATTERNS = [/passportnumber/i];

const isPlainObject = (value) => {
  return Object.prototype.toString.call(value) === "[object Object]";
};

const isDateLike = (value) => {
  if (value instanceof Date) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}/.test(value) || /t\d{2}:\d{2}:/i.test(value);
};

const formatDateValue = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString();
};

const humanizeKey = (key) => {
  return String(key || "")
    .split(".")
    .slice(-1)[0]
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const shouldExcludeKey = (key) => EXCLUDED_FIELD_PATTERNS.some((pattern) => pattern.test(String(key)));

const isEmpty = (value) => {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (isPlainObject(value)) {
    return Object.keys(value).length === 0;
  }

  return false;
};

const maskIfSensitive = (key, value) => {
  const keyText = String(key || "");

  if (MASKED_FIELD_PATTERNS.some((pattern) => pattern.test(keyText))) {
    const raw = String(value || "");
    if (raw.length <= 4) {
      return "****";
    }
    return `${"*".repeat(Math.max(raw.length - 4, 1))}${raw.slice(-4)}`;
  }

  return value;
};

const formatValue = (key, value) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (isDateLike(value)) {
    return formatDateValue(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "";
    }

    const primitiveOnly = value.every((item) => !isPlainObject(item) && !Array.isArray(item));
    if (primitiveOnly) {
      return value.map((item) => formatValue(key, item)).join(", ");
    }

    return value
      .map((item, index) => {
        if (isPlainObject(item)) {
          const fragments = Object.entries(item)
            .map(([itemKey, itemValue]) => `${humanizeKey(itemKey)}: ${formatValue(itemKey, itemValue)}`)
            .filter((entry) => !entry.endsWith(": "));

          return `${index + 1}. ${fragments.join(" | ")}`;
        }

        return `${index + 1}. ${formatValue(key, item)}`;
      })
      .join("\n");
  }

  if (isPlainObject(value)) {
    const fragments = Object.entries(value)
      .map(([entryKey, entryValue]) => `${humanizeKey(entryKey)}: ${formatValue(entryKey, entryValue)}`)
      .filter((entry) => !entry.endsWith(": "));

    return fragments.join("\n");
  }

  return String(maskIfSensitive(key, value));
};

const flattenObject = (input, parentKey = "") => {
  if (!isPlainObject(input)) {
    return [];
  }

  const entries = [];

  for (const [key, value] of Object.entries(input)) {
    if (shouldExcludeKey(key)) {
      continue;
    }

    const nextKey = parentKey ? `${parentKey}.${key}` : key;

    if (isPlainObject(value)) {
      const nested = flattenObject(value, nextKey);
      if (nested.length > 0) {
        entries.push(...nested);
      }
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      continue;
    }

    if (isEmpty(value)) {
      continue;
    }

    entries.push([nextKey, value]);
  }

  return entries;
};

const normalizeFormFields = (data, options = {}) => {
  const fieldPriority = Array.isArray(options.fieldPriority) ? options.fieldPriority : [];
  const flatEntries = flattenObject(data || {});
  const valueMap = new Map(flatEntries);

  const rows = [];
  const usedKeys = new Set();

  for (const field of fieldPriority) {
    if (!valueMap.has(field)) {
      continue;
    }

    const value = formatValue(field, valueMap.get(field));
    if (!value) {
      continue;
    }

    rows.push({
      key: field,
      label: FIELD_LABELS[field] || FIELD_LABELS[field.split(".").slice(-1)[0]] || humanizeKey(field),
      value,
    });
    usedKeys.add(field);
  }

  for (const [key, rawValue] of flatEntries) {
    if (usedKeys.has(key)) {
      continue;
    }

    const value = formatValue(key, rawValue);
    if (!value) {
      continue;
    }

    rows.push({
      key,
      label: FIELD_LABELS[key] || FIELD_LABELS[key.split(".").slice(-1)[0]] || humanizeKey(key),
      value,
    });
  }

  return rows;
};

const formatFileSize = (size) => {
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "-";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isFileLikeObject = (item) => {
  if (!isPlainObject(item)) {
    return false;
  }

  return ["fileUrl", "url", "path", "originalName", "originalname", "mimeType", "mimetype", "size"].some(
    (key) => Object.prototype.hasOwnProperty.call(item, key)
  );
};

const collectFileMetadata = (...sources) => {
  const files = [];

  const visit = (value, hint = "") => {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, hint));
      return;
    }

    if (!isPlainObject(value)) {
      return;
    }

    if (isFileLikeObject(value)) {
      files.push({
        label:
          value.label || value.docName || value.fieldname || value.fieldName || value.type || hint || "Uploaded File",
        originalName: value.originalName || value.originalname || value.filename || "",
        mimeType: value.mimeType || value.mimetype || "",
        size: formatFileSize(value.size),
        url: value.fileUrl || value.url || value.path || value.secure_url || "",
      });
      return;
    }

    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      visit(nestedValue, nestedKey);
    }
  };

  sources.forEach((source) => visit(source));

  const deduped = new Map();
  for (const item of files) {
    const dedupeKey = `${item.label}|${item.originalName}|${item.url}`;
    if (!deduped.has(dedupeKey)) {
      deduped.set(dedupeKey, item);
    }
  }

  return Array.from(deduped.values());
};

const extractPrimaryIdentity = (data = {}, record = {}, meta = {}) => {
  const fullNameFromParts = [
    data.firstName,
    data.lastName,
    data?.applicantDetails?.firstName,
    data?.applicantDetails?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const name =
    data.fullName ||
    data.name ||
    fullNameFromParts ||
    record.fullName ||
    record.name ||
    record?.applicantDetails?.firstName ||
    meta.primaryName ||
    "";

  const email =
    data.email || data?.applicantDetails?.email || record.email || record?.applicantDetails?.email || meta.primaryEmail || "";

  const phone =
    data.phone || data?.applicantDetails?.phone || record.phone || record?.applicantDetails?.phone || meta.primaryPhone || "";

  return {
    name: String(name || "").trim(),
    email: String(email || "").trim(),
    phone: String(phone || "").trim(),
  };
};

const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
};

const toEnvironmentLabel = (nodeEnv) => {
  const normalized = String(nodeEnv || "").toLowerCase();
  if (normalized === "production") {
    return "Production";
  }

  if (normalized === "staging") {
    return "Staging";
  }

  return "Development";
};

const getFormLabel = (formType, formLabel) => {
  if (formLabel) {
    return formLabel;
  }
  return FORM_LABELS[formType] || "Form Submission";
};

const buildSubject = ({ appName, formLabel, primary }) => {
  const identity = primary?.name || primary?.email || primary?.phone || "Unknown";
  return `[${appName}] New ${formLabel} Submission - ${identity}`;
};

const sendAdminFormNotification = async ({ formType, formLabel, data = {}, record = null, meta = {} }) => {
  const config = getMailRuntimeConfig();

  if (!config.mailEnabled) {
    console.info(`${FORM_MAIL_LOG_TAG} MAIL_ENABLED=false. Notification skipped for ${formType}.`);
    return { skipped: true, reason: "MAIL_DISABLED" };
  }

  if (!Array.isArray(config.adminNotificationTo) || config.adminNotificationTo.length === 0) {
    console.warn(
      `${FORM_MAIL_LOG_TAG} ADMIN_NOTIFICATION_EMAIL is missing. Notification skipped for ${formType}.`
    );
    return { skipped: true, reason: "MISSING_ADMIN_RECIPIENT" };
  }

  const resolvedFormLabel = getFormLabel(formType, formLabel);
  const primary = extractPrimaryIdentity(data, record || {}, meta || {});
  const fieldPriority = FORM_FIELD_PRIORITY[formType] || [];

  const enrichedData = {
    ...(isPlainObject(data) ? data : {}),
    ...(isPlainObject(meta?.extraData) ? meta.extraData : {}),
  };

  const rows = normalizeFormFields(enrichedData, { fieldPriority });
  const files = collectFileMetadata(meta?.files, record?.submittedDocs, record?.attachments, data?.submittedDocs);

  const subject = buildSubject({
    appName: config.appName,
    formLabel: resolvedFormLabel,
    primary,
  });

  const submittedAt = formatDateValue(meta?.submittedAt || record?.createdAt || new Date());
  const source =
    meta?.sourcePage ||
    meta?.sourceRoute ||
    meta?.pageSource ||
    data?.pageSource ||
    data?.source ||
    record?.source ||
    "N/A";

  const recordId =
    meta?.recordId || record?._id || record?.id || record?.applicationNumber || record?.enquiryNumber || record?.ticketNumber || "N/A";

  const template = buildFormSubmissionTemplate({
    appName: config.appName,
    environmentLabel: toEnvironmentLabel(config.nodeEnv),
    formLabel: resolvedFormLabel,
    subject,
    submittedAt,
    source,
    recordId,
    primary,
    rows,
    files,
  });

  const replyTo = isValidEmail(meta?.replyTo)
    ? meta.replyTo
    : isValidEmail(primary.email)
      ? primary.email
      : undefined;

  const result = await sendMail({
    to: config.adminNotificationTo,
    cc: config.adminNotificationCc,
    bcc: config.adminNotificationBcc,
    subject,
    html: template.html,
    text: template.text,
    replyTo,
  });

  if (result?.skipped) {
    console.info(`${FORM_MAIL_LOG_TAG} Notification skipped for ${formType}.`, {
      reason: result.reason,
    });
  } else {
    console.info(`${FORM_MAIL_LOG_TAG} Notification sent for ${formType}.`, {
      recordId,
      to: config.adminNotificationTo,
      messageId: result?.messageId,
    });
  }

  return result;
};

module.exports = {
  FIELD_LABELS,
  FORM_LABELS,
  FORM_FIELD_PRIORITY,
  normalizeFormFields,
  extractPrimaryIdentity,
  sendAdminFormNotification,
};
