const Lead = require("../../models/Lead.js");
const User = require("../../models/User.js");
const Country = require("../../models/Country.js");
const Applicant = require("../../models/Applicant.js");
const Case = require("../../models/Case.js");
const CaseDocument = require("../../models/CaseDocument.js");
const VisaCategory = require("../../models/VisaCategory.js");
const ServicePackage = require("../../models/ServicePackage.js");
const ChecklistTemplate = require("../../models/ChecklistTemplate.js");
const Appointment = require("../../models/Appointment.js");
const Invoice = require("../../models/Invoice.js");
const PaymentTransaction = require("../../models/PaymentTransaction.js");
const CommunicationTemplate = require("../../models/CommunicationTemplate.js");
const CountryProcessUpdate = require("../../models/CountryProcessUpdate.js");
const ConsentRecord = require("../../models/ConsentRecord.js");
const AuditTrail = require("../../models/AuditTrail.js");
const cloudinary = require("../../config/cloudinary.js");

const ApiError = require("../../utils/ApiError.js");
const { issueAuthTokens, rotateRefreshToken } = require("../../services/token.service.js");
const { uploadDocumentBuffer } = require("../../services/cloudinary.service.js");
const { logAuditEvent } = require("../../services/auditTrail.service.js");
const { buildDocumentName } = require("../../utils/documentNaming.js");
const { generateCaseId, generateInvoiceNumber, generateReceiptNumber } = require("../../utils/visaassist.id.js");
const { getPagination, getPaginationMeta } = require("../../utils/pagination.js");
const { buildSearchQuery, pickFilters, parseSort, listWithPagination } = require("../../utils/visaassist.query.js");
const {
  ROLES,
  LEAD_STAGES,
  CASE_STATUSES,
  PAYMENT_STATUSES,
  CHECKLIST_ITEM_STATUSES,
  TEMPLATE_CHANNELS,
} = require("../../utils/visaassist.constants.js");

const buildSafeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  phone: user.phone,
});

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureValidRole = (role) => {
  if (!ROLES.includes(role)) {
    throw new ApiError(403, "INVALID_ROLE", "This endpoint is for internal staff roles only");
  }
};

const isPrivilegedStaff = (role) => {
  return role === "super_admin" || role === "admin";
};

const clampExpiry = (value) => {
  const asNumber = Number.parseInt(value, 10);
  if (!Number.isFinite(asNumber)) {
    return 300;
  }

  return Math.min(Math.max(asNumber, 60), 3600);
};

const inferResourceType = (mimeType) => {
  if (String(mimeType).startsWith("image/")) {
    return "image";
  }

  if (String(mimeType).startsWith("video/")) {
    return "video";
  }

  return "raw";
};

const isCaseStaffMember = (caseRecord, userId) => {
  return (caseRecord.assignedStaff || []).some((memberId) => String(memberId) === String(userId));
};

const isMongoObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ""));

const staffLogin = async (payload, context) => {
  const user = await User.findOne({ email: payload.email.toLowerCase(), isActive: true }).select("+password");

  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const valid = await user.comparePassword(payload.password);
  if (!valid) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  ensureValidRole(user.role);

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueAuthTokens(user, context);

  return {
    user: buildSafeUser(user),
    ...tokens,
  };
};

const refreshStaffToken = async (refreshToken, context) => {
  const rotated = await rotateRefreshToken(refreshToken, context);
  if (!rotated) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
  }

  ensureValidRole(rotated.user.role);

  return {
    user: buildSafeUser(rotated.user),
    token: rotated.token,
    refreshToken: rotated.refreshToken,
  };
};

const getMyProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }
  return buildSafeUser(user);
};

const updateMyProfile = async (userId, payload) => {
  const allowedUpdates = ["firstName", "lastName", "phone", "avatarUrl", "country"];
  const updateData = {};
  for (const key of allowedUpdates) {
    if (payload[key] !== undefined) {
      updateData[key] = payload[key];
    }
  }

  const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select("-password");
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return buildSafeUser(user);
};

const createLead = async (payload, actorId = null) => {
  const lead = await Lead.create({
    ...payload,
    source: payload.source || "website",
    activityHistory: [
      {
        action: "lead_created",
        message: "Lead created",
        performedBy: actorId,
        metadata: { source: payload.source || "website" },
      },
    ],
  });

  if (actorId) {
    await logAuditEvent({
      actionType: "generic",
      entityType: "Lead",
      entityId: lead._id,
      actorId,
      leadId: lead._id,
      message: "Lead created",
    });
  }

  return lead;
};

const listLeads = async (query) => {
  const filters = pickFilters(query, ["stage", "assignedTo", "destinationCountry", "visaCategory", "source", "nationality"]);
  if (query.includeArchived !== "true") {
    filters.isArchived = false;
  }

  if (query.priorRefusal !== undefined) {
    filters.priorRefusal = query.priorRefusal === "true";
  }

  const searchQuery = buildSearchQuery(query.search, ["fullName", "email", "phone"]);
  const filter = { ...filters, ...searchQuery };

  return listWithPagination({
    model: Lead,
    filter,
    query,
    sort: parseSort(query.sortBy, query.sortOrder),
    populate: ["assignedTo"],
  });
};

const getLeadById = async (leadId) => {
  if (!isMongoObjectId(leadId)) {
    throw new ApiError(400, "INVALID_LEAD_ID", "Lead id is invalid");
  }

  const lead = await Lead.findById(leadId).populate("assignedTo");
  if (!lead) {
    throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
  }

  return lead;
};

const listStaff = async (query) => {
  if (query.role && !ROLES.includes(query.role)) {
    throw new ApiError(400, "INVALID_ROLE", "Role filter is invalid");
  }

  const { page, limit, skip } = getPagination(query);
  const filter = {
    role: query.role || { $in: ROLES },
    isActive: query.includeInactive === "true" ? { $in: [true, false] } : true,
  };

  const searchQuery = buildSearchQuery(query.search, ["firstName", "lastName", "email", "phone"]);
  if (Object.keys(searchQuery).length) {
    filter.$or = searchQuery.$or;
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort(parseSort(query.sortBy, query.sortOrder)).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    items: items.map((user) => buildSafeUser(user)),
    pagination: getPaginationMeta(page, limit, total),
  };
};

const assignLead = async (leadId, payload, actorId) => {
  const staff = await User.findById(payload.assignedTo);
  if (!staff) {
    throw new ApiError(404, "STAFF_NOT_FOUND", "Assigned staff not found");
  }
  ensureValidRole(staff.role);

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
  }

  lead.assignedTo = payload.assignedTo;
  lead.activityHistory.push({
    action: "lead_assigned",
    message: `Lead assigned to ${staff.email}`,
    performedBy: actorId,
    metadata: { assignedTo: payload.assignedTo },
  });
  await lead.save();

  await logAuditEvent({
    actionType: "assignment_change",
    entityType: "Lead",
    entityId: lead._id,
    actorId,
    leadId: lead._id,
    message: "Lead assignment updated",
    metadata: { assignedTo: payload.assignedTo },
  });

  return lead;
};

const addLeadNote = async (leadId, payload, actorId) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
  }

  lead.noteHistory.push({ note: payload.note, createdBy: actorId });
  lead.activityHistory.push({
    action: "lead_note_added",
    message: "Lead note added",
    performedBy: actorId,
  });

  await lead.save();

  return lead;
};

const updateLeadStage = async (leadId, payload, actorId) => {
  if (!LEAD_STAGES.includes(payload.stage)) {
    throw new ApiError(400, "INVALID_STAGE", "Invalid lead stage");
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
  }

  const previousStage = lead.stage;
  lead.stage = payload.stage;
  lead.activityHistory.push({
    action: "lead_stage_changed",
    message: `Lead stage changed from ${previousStage} to ${payload.stage}`,
    performedBy: actorId,
    metadata: { from: previousStage, to: payload.stage },
  });
  await lead.save();

  await logAuditEvent({
    actionType: "status_change",
    entityType: "Lead",
    entityId: lead._id,
    actorId,
    leadId: lead._id,
    message: "Lead stage changed",
    metadata: { from: previousStage, to: payload.stage },
  });

  return lead;
};

const createCountry = async (payload) => {
  const name = String(payload.name).trim();
  const country = await Country.create({
    name,
    slug: payload.slug || slugify(name),
    code: String(payload.code).trim().toUpperCase(),
    region: payload.region || "",
    description: payload.description || "",
    isFeatured: Boolean(payload.isFeatured),
    ranking: payload.ranking || 0,
    imageUrl: payload.imageUrl || "",
  });

  return country;
};

const listCountries = async (query) => {
  const filters = pickFilters(query, ["region", "code"]);
  return listWithPagination({
    model: Country,
    filter: filters,
    query,
    sort: parseSort(query.sortBy || "ranking", query.sortOrder || "desc"),
  });
};

const createVisaCategory = async (payload) => {
  return VisaCategory.create({
    ...payload,
    slug: payload.slug || slugify(payload.name),
  });
};

const listVisaCategories = async (query) => {
  const filters = pickFilters(query, ["isActive"]);
  return listWithPagination({
    model: VisaCategory,
    filter: filters,
    query,
    sort: parseSort(query.sortBy, query.sortOrder),
  });
};

const createServicePackage = async (payload) => {
  const visaCategory = await VisaCategory.findById(payload.visaCategory);
  if (!visaCategory) {
    throw new ApiError(404, "VISA_CATEGORY_NOT_FOUND", "Visa category not found");
  }

  return ServicePackage.create({
    ...payload,
    slug: payload.slug || slugify(payload.name),
  });
};

const listServicePackages = async (query) => {
  const filters = pickFilters(query, ["destinationCountry", "visaCategory", "isActive"]);
  return listWithPagination({
    model: ServicePackage,
    filter: filters,
    query,
    sort: parseSort(query.sortBy, query.sortOrder),
    populate: ["visaCategory"],
  });
};

const updateServiceAvailability = async (packageId, isActive) => {
  const servicePackage = await ServicePackage.findByIdAndUpdate(
    packageId,
    { $set: { isActive } },
    { new: true }
  );

  if (!servicePackage) {
    throw new ApiError(404, "PACKAGE_NOT_FOUND", "Service package not found");
  }

  return servicePackage;
};

const createChecklistTemplate = async (payload, actorId) => {
  const latest = await ChecklistTemplate.findOne({
    destinationCountry: payload.destinationCountry,
    visaCategory: payload.visaCategory,
  })
    .sort({ version: -1 })
    .lean();

  const version = payload.version || (latest?.version || 0) + 1;

  if (payload.isActiveVersion !== false) {
    await ChecklistTemplate.updateMany(
      { destinationCountry: payload.destinationCountry, visaCategory: payload.visaCategory },
      { $set: { isActiveVersion: false } }
    );
  }

  return ChecklistTemplate.create({
    ...payload,
    version,
    isActiveVersion: payload.isActiveVersion !== false,
    changeLog: [
      {
        summary: payload.changeSummary || "Initial version",
        changedBy: actorId,
      },
    ],
  });
};

const listChecklistTemplates = async (query) => {
  const filters = pickFilters(query, ["destinationCountry", "visaCategory", "status"]);
  return listWithPagination({
    model: ChecklistTemplate,
    filter: filters,
    query,
    sort: parseSort(query.sortBy || "version", query.sortOrder || "desc"),
    populate: ["visaCategory"],
  });
};

const generateCaseChecklist = async (caseMongoId, payload, actorId) => {
  const [existingCase, template] = await Promise.all([
    Case.findById(caseMongoId),
    ChecklistTemplate.findById(payload.templateId),
  ]);

  if (!existingCase) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found");
  }
  if (!template) {
    throw new ApiError(404, "CHECKLIST_TEMPLATE_NOT_FOUND", "Checklist template not found");
  }

  existingCase.checklistItems = template.items.map((item) => ({
    checklistItemId: item.key,
    label: item.label,
    required: item.required,
    status: "pending",
    remarks: "",
  }));

  existingCase.timeline.push({
    status: existingCase.caseStatus,
    note: `Checklist generated from template version ${template.version}`,
    changedBy: actorId,
  });

  await existingCase.save();

  await logAuditEvent({
    actionType: "generic",
    entityType: "Case",
    entityId: existingCase._id,
    actorId,
    caseId: existingCase._id,
    leadId: existingCase.leadId,
    message: "Checklist generated for case",
    metadata: { templateId: template._id, templateVersion: template.version },
  });

  return existingCase;
};

const updateCaseChecklistItem = async (caseMongoId, itemId, payload, actorId) => {
  if (!CHECKLIST_ITEM_STATUSES.includes(payload.status)) {
    throw new ApiError(400, "INVALID_CHECKLIST_STATUS", "Invalid checklist item status");
  }

  const existingCase = await Case.findById(caseMongoId);
  if (!existingCase) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found");
  }

  const itemIndex = existingCase.checklistItems.findIndex((item) => item.checklistItemId === itemId);
  if (itemIndex === -1) {
    throw new ApiError(404, "CHECKLIST_ITEM_NOT_FOUND", "Checklist item not found");
  }

  existingCase.checklistItems[itemIndex].status = payload.status;
  existingCase.checklistItems[itemIndex].remarks = payload.remarks || "";
  existingCase.checklistItems[itemIndex].documentId = payload.documentId || null;
  existingCase.checklistItems[itemIndex].updatedBy = actorId;
  existingCase.checklistItems[itemIndex].updatedAt = new Date();

  await existingCase.save();

  return existingCase;
};

const createApplicant = async (payload, actorId) => {
  if (payload.leadId) {
    const lead = await Lead.findById(payload.leadId);
    if (!lead) {
      throw new ApiError(404, "LEAD_NOT_FOUND", "Lead not found");
    }
  }

  const now = new Date();

  const applicant = await Applicant.create({
    ...payload,
    createdBy: actorId,
    consentAcceptedAt: payload.consentAccepted ? now : undefined,
    disclaimerAcceptedAt: payload.disclaimerAccepted ? now : undefined,
    refundPolicyAcceptedAt: payload.refundPolicyAccepted ? now : undefined,
  });

  if (payload.leadId && payload.markLeadConverted) {
    await Lead.findByIdAndUpdate(payload.leadId, {
      $set: {
        stage: "converted",
        convertedApplicantId: applicant._id,
      },
      $push: {
        activityHistory: {
          action: "lead_converted",
          message: "Lead converted to applicant",
          performedBy: actorId,
          metadata: { applicantId: applicant._id },
        },
      },
    });
  }

  await logAuditEvent({
    actionType: "generic",
    entityType: "Applicant",
    entityId: applicant._id,
    actorId,
    leadId: applicant.leadId,
    message: "Applicant profile created",
  });

  return applicant;
};

const listApplicants = async (query) => {
  const filters = pickFilters(query, ["leadId", "nationality", "consentAccepted", "disclaimerAccepted"]);
  const searchQuery = buildSearchQuery(query.search, ["fullName", "email", "phone", "passport.passportNumber"]);

  return listWithPagination({
    model: Applicant,
    filter: { ...filters, ...searchQuery },
    query,
    sort: parseSort(query.sortBy, query.sortOrder),
  });
};

const getApplicantById = async (applicantId) => {
  if (!isMongoObjectId(applicantId)) {
    throw new ApiError(400, "INVALID_APPLICANT_ID", "Applicant id is invalid");
  }

  const applicant = await Applicant.findById(applicantId).populate("leadId", "fullName email stage");
  if (!applicant) {
    throw new ApiError(404, "APPLICANT_NOT_FOUND", "Applicant not found");
  }

  return applicant;
};

const buildUniqueCaseId = async () => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const caseId = generateCaseId();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Case.findOne({ caseId }).lean();
    if (!exists) {
      return caseId;
    }
  }

  throw new ApiError(500, "CASE_ID_GENERATION_FAILED", "Could not generate unique case id");
};

const createCase = async (payload, actorId) => {
  const applicant = await Applicant.findById(payload.applicantId);
  if (!applicant) {
    throw new ApiError(404, "APPLICANT_NOT_FOUND", "Applicant not found");
  }

  const caseId = await buildUniqueCaseId();

  const caseData = {
    ...payload,
    caseId,
    timeline: [
      {
        status: payload.caseStatus || "inquiry_received",
        note: "Case created",
        changedBy: actorId,
      },
    ],
  };

  const createdCase = await Case.create(caseData);

  if (payload.leadId) {
    await Lead.findByIdAndUpdate(payload.leadId, {
      $set: { convertedCaseId: createdCase._id, stage: "converted" },
    });
  }

  await logAuditEvent({
    actionType: "status_change",
    entityType: "Case",
    entityId: createdCase._id,
    actorId,
    caseId: createdCase._id,
    leadId: createdCase.leadId,
    message: "Case created",
    metadata: { caseStatus: createdCase.caseStatus },
  });

  return createdCase;
};

const listCases = async (query) => {
  const filters = pickFilters(query, [
    "caseStatus",
    "destinationCountry",
    "visaCategory",
    "priority",
    "leadId",
    "applicantId",
  ]);

  if (query.includeArchived !== "true") {
    filters.isArchived = false;
  }

  const searchQuery = buildSearchQuery(query.search, ["caseId", "visaCategory", "destinationCountry"]);

  if (query.assignedStaff) {
    filters.assignedStaff = query.assignedStaff;
  }

  return listWithPagination({
    model: Case,
    filter: { ...filters, ...searchQuery },
    query,
    sort: parseSort(query.sortBy, query.sortOrder),
    populate: ["applicantId", "leadId", "packageId", "assignedStaff"],
  });
};

const getCaseById = async (caseId) => {
  const caseRecord = isMongoObjectId(caseId)
    ? await Case.findById(caseId)
    : await Case.findOne({ caseId });

  const populated = await caseRecord?.populate(["applicantId", "leadId", "packageId", "assignedStaff"]);
  if (!populated) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found");
  }

  return populated;
};

const updateCaseStatus = async (caseMongoId, payload, actorId) => {
  if (!CASE_STATUSES.includes(payload.caseStatus)) {
    throw new ApiError(400, "INVALID_CASE_STATUS", "Invalid case status");
  }

  const existingCase = await Case.findById(caseMongoId);
  if (!existingCase) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found");
  }

  const previousStatus = existingCase.caseStatus;
  existingCase.caseStatus = payload.caseStatus;
  existingCase.timeline.push({
    status: payload.caseStatus,
    note: payload.note || "Status updated",
    changedBy: actorId,
  });

  await existingCase.save();

  await logAuditEvent({
    actionType: "status_change",
    entityType: "Case",
    entityId: existingCase._id,
    actorId,
    caseId: existingCase._id,
    leadId: existingCase.leadId,
    message: "Case status changed",
    metadata: { from: previousStatus, to: payload.caseStatus },
  });

  return existingCase;
};

const addCaseNote = async (caseMongoId, payload, actorId) => {
  const existingCase = await Case.findById(caseMongoId);
  if (!existingCase) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found");
  }

  const note = {
    message: payload.message,
    createdBy: actorId,
    createdAt: new Date(),
  };

  if (payload.visibility === "customer") {
    existingCase.customerNotes.push(note);
  } else {
    existingCase.internalNotes.push(note);
  }

  await existingCase.save();

  return existingCase;
};

const assignCaseStaff = async (caseMongoId, payload, actorId) => {
  const staff = await User.find({ _id: { $in: payload.assignedStaff } });
  if (!staff.length) {
    throw new ApiError(404, "STAFF_NOT_FOUND", "No valid staff users provided");
  }

  for (const member of staff) {
    ensureValidRole(member.role);
  }

  const existingCase = await Case.findByIdAndUpdate(
    caseMongoId,
    { $set: { assignedStaff: payload.assignedStaff } },
    { new: true }
  );

  if (!existingCase) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found");
  }

  await logAuditEvent({
    actionType: "assignment_change",
    entityType: "Case",
    entityId: existingCase._id,
    actorId,
    caseId: existingCase._id,
    leadId: existingCase.leadId,
    message: "Case assignment updated",
    metadata: { assignedStaff: payload.assignedStaff },
  });

  return existingCase;
};

const uploadCaseDocument = async (payload, actorId) => {
  if (!payload.file) {
    throw new ApiError(400, "FILE_REQUIRED", "File is required");
  }

  const [existingCase, applicant] = await Promise.all([
    Case.findById(payload.caseId),
    Applicant.findById(payload.applicantId),
  ]);

  if (!existingCase) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found");
  }
  if (!applicant) {
    throw new ApiError(404, "APPLICANT_NOT_FOUND", "Applicant not found");
  }

  const extension = payload.file.originalname.split(".").pop();
  const documentName = buildDocumentName({
    caseId: existingCase.caseId,
    applicantId: applicant._id,
    documentType: payload.documentType,
    extension,
  });

  const uploadResult = await uploadDocumentBuffer(
    payload.file.buffer,
    payload.file.mimetype,
    `visaassist/cases/${existingCase.caseId}`,
    { deliveryType: "authenticated" }
  );

  const doc = await CaseDocument.create({
    documentType: payload.documentType,
    documentName,
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    fileSize: payload.file.size,
    mimeType: payload.file.mimetype,
    uploadedBy: actorId,
    applicantId: payload.applicantId,
    caseId: payload.caseId,
    checklistItemId: payload.checklistItemId || "",
    accessLevel: payload.accessLevel || "internal",
    storageProvider: "cloudinary",
    storageAccessType: "authenticated",
  });

  if (payload.checklistItemId) {
    const checklistItem = existingCase.checklistItems.find((item) => item.checklistItemId === payload.checklistItemId);
    if (checklistItem) {
      checklistItem.status = "received";
      checklistItem.documentId = doc._id;
      checklistItem.updatedBy = actorId;
      checklistItem.updatedAt = new Date();
      await existingCase.save();
    }
  }

  await logAuditEvent({
    actionType: "file_upload",
    entityType: "CaseDocument",
    entityId: doc._id,
    actorId,
    caseId: existingCase._id,
    leadId: existingCase.leadId,
    message: "Case document uploaded",
    metadata: {
      documentType: payload.documentType,
      accessLevel: payload.accessLevel || "internal",
    },
    sensitivity: "sensitive",
  });

  return doc;
};

const listCaseDocuments = async (query) => {
  const filters = pickFilters(query, ["caseId", "applicantId", "documentType", "checklistItemId", "accessLevel"]);
  if (query.includeArchived !== "true") {
    filters.isArchived = false;
  }

  return listWithPagination({
    model: CaseDocument,
    filter: filters,
    query,
    sort: parseSort(query.sortBy, query.sortOrder),
    populate: ["uploadedBy", "applicantId", "caseId"],
  });
};

const archiveCaseDocument = async (documentId, actorId) => {
  const document = await CaseDocument.findByIdAndUpdate(
    documentId,
    { $set: { isArchived: true, archivedAt: new Date() } },
    { new: true }
  );

  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  await logAuditEvent({
    actionType: "generic",
    entityType: "CaseDocument",
    entityId: document._id,
    actorId,
    caseId: document.caseId,
    message: "Document archived",
    sensitivity: "sensitive",
  });

  return document;
};

const getCaseDocumentAccessUrl = async (documentId, requester, query = {}) => {
  const document = await CaseDocument.findById(documentId).lean();
  if (!document) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }

  if (document.isArchived) {
    throw new ApiError(410, "DOCUMENT_ARCHIVED", "Document is archived");
  }

  const caseRecord = await Case.findById(document.caseId).select("assignedStaff leadId").lean();
  if (!caseRecord) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found for document");
  }

  const hasAccess =
    isPrivilegedStaff(requester.role) ||
    isCaseStaffMember(caseRecord, requester._id) ||
    String(document.uploadedBy) === String(requester._id);

  if (!hasAccess) {
    throw new ApiError(403, "FORBIDDEN", "You do not have access to this document");
  }

  const expiresInSec = clampExpiry(query.expiresInSec);
  const expiresAtUnix = Math.floor(Date.now() / 1000) + expiresInSec;

  let accessUrl = document.fileUrl;
  let accessMode = "direct";

  if (document.storageProvider === "cloudinary" && document.storageAccessType === "authenticated") {
    accessUrl = cloudinary.url(document.publicId, {
      secure: true,
      sign_url: true,
      type: "authenticated",
      resource_type: inferResourceType(document.mimeType),
      expires_at: expiresAtUnix,
    });
    accessMode = "signed";
  }

  await logAuditEvent({
    actionType: "generic",
    entityType: "CaseDocument",
    entityId: document._id,
    actorId: requester._id,
    caseId: document.caseId,
    leadId: caseRecord.leadId,
    message: "Issued document access URL",
    metadata: {
      accessMode,
      expiresInSec,
      accessLevel: document.accessLevel,
    },
    sensitivity: "sensitive",
  });

  return {
    documentId: document._id,
    documentName: document.documentName,
    mimeType: document.mimeType,
    accessMode,
    expiresInSec,
    expiresAt: new Date(expiresAtUnix * 1000),
    accessUrl,
  };
};

const createAppointment = async (payload, actorId) => {
  const existingCase = await Case.findById(payload.caseId);
  if (!existingCase) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found");
  }

  const appointment = await Appointment.create(payload);

  existingCase.appointmentInfo.nextAppointmentId = appointment._id;
  existingCase.appointmentInfo.hasPendingAppointment = ["pending", "confirmed", "rescheduled"].includes(
    appointment.bookingStatus
  );
  if (existingCase.caseStatus !== "appointment_pending") {
    existingCase.caseStatus = "appointment_pending";
    existingCase.timeline.push({
      status: "appointment_pending",
      note: "Appointment tracking initiated",
      changedBy: actorId,
    });
  }

  await existingCase.save();

  return appointment;
};

const rescheduleAppointment = async (appointmentId, payload, actorId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "APPOINTMENT_NOT_FOUND", "Appointment not found");
  }

  appointment.rescheduleHistory.push({
    fromDate: appointment.appointmentDate,
    toDate: payload.appointmentDate,
    reason: payload.reason || "",
    changedBy: actorId,
  });
  appointment.appointmentDate = payload.appointmentDate;
  appointment.appointmentTime = payload.appointmentTime || appointment.appointmentTime;
  appointment.bookingStatus = "rescheduled";
  appointment.remarks = payload.remarks || appointment.remarks;

  await appointment.save();

  return appointment;
};

const listUpcomingAppointments = async (query) => {
  const filters = pickFilters(query, ["caseId", "applicantId", "appointmentType", "bookingStatus"]);
  filters.appointmentDate = { $gte: new Date() };

  return listWithPagination({
    model: Appointment,
    filter: filters,
    query,
    sort: parseSort(query.sortBy || "appointmentDate", query.sortOrder || "asc"),
    populate: ["caseId", "applicantId"],
  });
};

const calculateInvoiceTotals = (lineItems) => {
  const normalized = lineItems.map((line) => {
    const quantity = Number(line.quantity || 1);
    const unitPrice = Number(line.unitPrice || 0);
    const taxPercent = Number(line.taxPercent || 0);
    const preTax = quantity * unitPrice;
    const tax = (preTax * taxPercent) / 100;

    return {
      description: line.description,
      quantity,
      unitPrice,
      taxPercent,
      amount: Number((preTax + tax).toFixed(2)),
    };
  });

  const subTotal = Number(
    normalized.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0).toFixed(2)
  );
  const totalAmount = Number(normalized.reduce((acc, item) => acc + item.amount, 0).toFixed(2));
  const taxTotal = Number((totalAmount - subTotal).toFixed(2));

  return { normalized, subTotal, taxTotal, totalAmount };
};

const buildUniqueInvoiceNumber = async () => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const invoiceNumber = generateInvoiceNumber();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Invoice.findOne({ invoiceNumber }).lean();
    if (!exists) {
      return invoiceNumber;
    }
  }

  throw new ApiError(500, "INVOICE_NUMBER_GENERATION_FAILED", "Could not generate invoice number");
};

const createInvoice = async (payload, actorId) => {
  const [existingCase, applicant] = await Promise.all([
    Case.findById(payload.caseId),
    Applicant.findById(payload.applicantId),
  ]);

  if (!existingCase) {
    throw new ApiError(404, "CASE_NOT_FOUND", "Case not found");
  }
  if (!applicant) {
    throw new ApiError(404, "APPLICANT_NOT_FOUND", "Applicant not found");
  }

  const { normalized, subTotal, taxTotal, totalAmount } = calculateInvoiceTotals(payload.lineItems);
  const invoiceNumber = await buildUniqueInvoiceNumber();

  const invoice = await Invoice.create({
    ...payload,
    lineItems: normalized,
    invoiceNumber,
    subTotal,
    taxTotal,
    totalAmount,
    paidAmount: 0,
    balanceDue: totalAmount,
    paymentStatus: "pending",
    generatedBy: actorId,
  });

  await logAuditEvent({
    actionType: "generic",
    entityType: "Invoice",
    entityId: invoice._id,
    actorId,
    caseId: invoice.caseId,
    leadId: invoice.leadId,
    message: "Invoice created",
    metadata: { invoiceNumber },
  });

  return invoice;
};

const listInvoices = async (query) => {
  const filters = pickFilters(query, ["caseId", "applicantId", "paymentStatus", "currency"]);

  return listWithPagination({
    model: Invoice,
    filter: filters,
    query,
    sort: parseSort(query.sortBy, query.sortOrder),
    populate: ["caseId", "applicantId", "packageId"],
  });
};

const recordInvoicePayment = async (invoiceId, payload, actorId) => {
  if (!PAYMENT_STATUSES.includes(payload.status)) {
    throw new ApiError(400, "INVALID_PAYMENT_STATUS", "Invalid payment status");
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new ApiError(404, "INVOICE_NOT_FOUND", "Invoice not found");
  }

  const amount = Number(payload.amount || 0);

  if (payload.status === "refunded") {
    invoice.paymentStatus = "refunded";
    invoice.balanceDue = invoice.totalAmount;
    invoice.paidAmount = 0;
  } else {
    const nextPaidAmount = Number(Math.min(invoice.totalAmount, invoice.paidAmount + amount).toFixed(2));
    const balanceDue = Number((invoice.totalAmount - nextPaidAmount).toFixed(2));

    invoice.paidAmount = nextPaidAmount;
    invoice.balanceDue = balanceDue;
    invoice.paymentStatus = nextPaidAmount === 0 ? "pending" : balanceDue === 0 ? "paid" : "partial";
  }

  invoice.receiptNumber = generateReceiptNumber();
  await invoice.save();

  const transaction = await PaymentTransaction.create({
    invoiceId: invoice._id,
    caseId: invoice.caseId,
    amount,
    currency: payload.currency || invoice.currency,
    method: payload.method || "manual",
    transactionReference: payload.transactionReference || "",
    status: payload.status,
    paidAt: payload.paidAt || new Date(),
    recordedBy: actorId,
    notes: payload.notes || "",
    gatewayResponse: payload.gatewayResponse || {},
  });

  await logAuditEvent({
    actionType: "payment_update",
    entityType: "Invoice",
    entityId: invoice._id,
    actorId,
    caseId: invoice.caseId,
    leadId: invoice.leadId,
    message: "Invoice payment recorded",
    metadata: {
      transactionId: transaction._id,
      amount,
      status: payload.status,
      paymentStatus: invoice.paymentStatus,
    },
  });

  return { invoice, transaction };
};

const getInvoiceDownloadData = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId)
    .populate("applicantId")
    .populate("caseId")
    .populate("packageId")
    .lean();

  if (!invoice) {
    throw new ApiError(404, "INVOICE_NOT_FOUND", "Invoice not found");
  }

  return {
    invoice,
    legalNotice:
      "Visaassist.org provides documentation and process advisory support only and does not offer legal immigration representation.",
  };
};

const createCommunicationTemplate = async (payload, actorId) => {
  if (!TEMPLATE_CHANNELS.includes(payload.channel)) {
    throw new ApiError(400, "INVALID_CHANNEL", "Invalid template channel");
  }

  return CommunicationTemplate.create({
    ...payload,
    key: payload.key || slugify(`${payload.channel}-${payload.name}`),
    createdBy: actorId,
  });
};

const listCommunicationTemplates = async (query) => {
  const filters = pickFilters(query, ["channel", "isActive"]);

  return listWithPagination({
    model: CommunicationTemplate,
    filter: filters,
    query,
    sort: parseSort(query.sortBy, query.sortOrder),
  });
};

const updateCommunicationTemplate = async (templateId, payload) => {
  const template = await CommunicationTemplate.findByIdAndUpdate(
    templateId,
    { $set: payload },
    { new: true }
  );

  if (!template) {
    throw new ApiError(404, "TEMPLATE_NOT_FOUND", "Template not found");
  }

  return template;
};

const createCountryProcessUpdate = async (payload, actorId) => {
  const latest = await CountryProcessUpdate.findOne({ destinationCountry: payload.destinationCountry })
    .sort({ version: -1 })
    .lean();
  const version = payload.version || (latest?.version || 0) + 1;

  if (payload.isActiveVersion !== false) {
    await CountryProcessUpdate.updateMany(
      { destinationCountry: payload.destinationCountry },
      { $set: { isActiveVersion: false } }
    );
  }

  return CountryProcessUpdate.create({
    ...payload,
    version,
    isActiveVersion: payload.isActiveVersion !== false,
    weeklyUpdateLog: [
      {
        weekStart: payload.weekStart || new Date(),
        summary: payload.weeklySummary || "Initial update",
        updatedBy: actorId,
      },
    ],
  });
};

const listCountryProcessUpdates = async (query) => {
  const filters = pickFilters(query, ["destinationCountry", "isActiveVersion"]);
  return listWithPagination({
    model: CountryProcessUpdate,
    filter: filters,
    query,
    sort: parseSort(query.sortBy || "effectiveDate", query.sortOrder || "desc"),
  });
};

const getDashboardSummary = async () => {
  const [leadCountsByStage, caseCountsByStatus, revenueSummary, pendingDocumentCount, upcomingAppointments, staffWorkload, countryCaseVolume] =
    await Promise.all([
      Lead.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: "$stage", count: { $sum: 1 } } },
      ]),
      Case.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: "$caseStatus", count: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            totalBilled: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
            invoiceCount: { $sum: 1 },
          },
        },
      ]),
      Case.aggregate([
        { $unwind: "$checklistItems" },
        { $match: { "checklistItems.status": "pending", isArchived: false } },
        { $count: "pendingCount" },
      ]),
      Appointment.find({ appointmentDate: { $gte: new Date() } })
        .sort({ appointmentDate: 1 })
        .limit(10)
        .populate("caseId applicantId"),
      Case.aggregate([
        { $match: { isArchived: false, caseStatus: { $nin: ["closed"] } } },
        { $unwind: "$assignedStaff" },
        { $group: { _id: "$assignedStaff", activeCaseCount: { $sum: 1 } } },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "staff",
          },
        },
      ]),
      Case.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: "$destinationCountry", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

  return {
    leadCountsByStage,
    caseCountsByStatus,
    revenueSummary: revenueSummary[0] || { totalBilled: 0, totalPaid: 0, invoiceCount: 0 },
    pendingDocumentCount: pendingDocumentCount[0]?.pendingCount || 0,
    upcomingAppointments,
    staffWorkload,
    countryCaseVolume,
  };
};

const recordConsent = async (payload, context, actorId) => {
  const applicant = await Applicant.findById(payload.applicantId);
  if (!applicant) {
    throw new ApiError(404, "APPLICANT_NOT_FOUND", "Applicant not found");
  }

  const consent = await ConsentRecord.create({
    ...payload,
    acceptedBy: actorId || null,
    ipAddress: context.ipAddress || "",
    userAgent: context.userAgent || "",
    acceptedAt: payload.acceptedAt || new Date(),
  });

  if (payload.accepted) {
    const updateFields = {};
    if (payload.consentType === "consent") {
      updateFields.consentAccepted = true;
      updateFields.consentAcceptedAt = consent.acceptedAt;
    }
    if (payload.consentType === "disclaimer") {
      updateFields.disclaimerAccepted = true;
      updateFields.disclaimerAcceptedAt = consent.acceptedAt;
    }
    if (payload.consentType === "refund_policy") {
      updateFields.refundPolicyAccepted = true;
      updateFields.refundPolicyAcceptedAt = consent.acceptedAt;
    }

    if (Object.keys(updateFields).length > 0) {
      await Applicant.findByIdAndUpdate(payload.applicantId, { $set: updateFields });
    }
  }

  await logAuditEvent({
    actionType: "consent_recorded",
    entityType: "ConsentRecord",
    entityId: consent._id,
    actorId: actorId || payload.acceptedBy,
    caseId: payload.caseId,
    message: "Consent record stored",
    metadata: { consentType: payload.consentType, accepted: payload.accepted },
    sensitivity: "sensitive",
  });

  return consent;
};

const listAuditTrail = async (query) => {
  const filters = pickFilters(query, ["actionType", "entityType", "caseId", "leadId", "actorId"]);
  const searchQuery = buildSearchQuery(query.search, ["message", "entityId"]);

  return listWithPagination({
    model: AuditTrail,
    filter: { ...filters, ...searchQuery },
    query,
    sort: parseSort(query.sortBy || "createdAt", query.sortOrder || "desc"),
    populate: ["actorId", "caseId", "leadId"],
  });
};

module.exports = {
  staffLogin,
  refreshStaffToken,
  getMyProfile,
  updateMyProfile,
  createLead,
  listLeads,
  getLeadById,
  listStaff,
  assignLead,
  addLeadNote,
  updateLeadStage,
  createCountry,
  listCountries,
  createVisaCategory,
  listVisaCategories,
  createServicePackage,
  listServicePackages,
  updateServiceAvailability,
  createChecklistTemplate,
  listChecklistTemplates,
  generateCaseChecklist,
  updateCaseChecklistItem,
  createApplicant,
  listApplicants,
  getApplicantById,
  createCase,
  listCases,
  getCaseById,
  updateCaseStatus,
  addCaseNote,
  assignCaseStaff,
  uploadCaseDocument,
  listCaseDocuments,
  archiveCaseDocument,
  getCaseDocumentAccessUrl,
  createAppointment,
  rescheduleAppointment,
  listUpcomingAppointments,
  createInvoice,
  listInvoices,
  recordInvoicePayment,
  getInvoiceDownloadData,
  createCommunicationTemplate,
  listCommunicationTemplates,
  updateCommunicationTemplate,
  createCountryProcessUpdate,
  listCountryProcessUpdates,
  getDashboardSummary,
  recordConsent,
  listAuditTrail,
};
