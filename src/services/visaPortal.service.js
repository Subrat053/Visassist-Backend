const Country = require("../models/Country.js");
const VisaCategory = require("../models/VisaCategory.js");
const CountryVisaType = require("../models/CountryVisaType.js");
const { VisaApplication, VISA_APPLICATION_STATUSES } = require("../models/VisaApplication.js");
const { Enquiry, ENQUIRY_STATUSES, ENQUIRY_TYPES } = require("../models/Enquiry.js");
const {
  SupportTicket,
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
} = require("../models/SupportTicket.js");
const Setting = require("../models/Setting.js");
const { visaTypesSeed } = require("../seed/visaTypes.data.js");
const User = require("../models/User.js");
const { uploadDocumentBuffer } = require("./cloudinary.service.js");
const { sendAdminFormNotification } = require("./email");
const ApiError = require("../utils/ApiError.js");
const { getPagination, getPaginationMeta } = require("../utils/pagination.js");

const ALLOWED_ICON_KEYS = new Set([
  "graduation-cap",
  "users",
  "briefcase",
  "plane",
  "file-text",
  "shield-check",
  "clock-3",
  "badge-check",
  "sparkles",
  "folder-check",
  "messages-square",
  "map-pinned",
  "heart-handshake",
]);

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const PUBLIC_SITE_SETTINGS_DEFAULTS = {
  siteName: "Visaassist",
  siteTagline: "Global Services",
  siteLogoUrl: "",
  supportPhone: "+19729720314",
  whatsappNumber: "+19729720314",
  homeBannerTitle: "What can we do for you today?",
  homeBannerSubtitle:
    "Choose your goal and let us guide you with the right solution, expert support, and the best next steps for your journey.",
  homeBannerImageUrl:
    "https://media.istockphoto.com/id/1197578214/photo/beautiful-young-woman.jpg?s=612x612&w=0&k=20&c=XdV1GLQalvNSXKsBv4C0vRDjPfiBOArH6BC_iCFtchg=",
};

const PUBLIC_SITE_SETTING_KEYS = {
  siteName: "site.name",
  siteTagline: "site.tagline",
  siteLogoUrl: "site.logoUrl",
  supportPhone: "site.supportPhone",
  whatsappNumber: "site.whatsappNumber",
  homeBannerTitle: "site.homeBannerTitle",
  homeBannerSubtitle: "site.homeBannerSubtitle",
  homeBannerImageUrl: "site.homeBannerImageUrl",
};

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const trim = (value) => String(value || "").trim();

const parseIfJson = (value, fallback) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
};

const parseQueryBoolean = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
};

const normalizeStringArray = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => trim(item))
    .filter(Boolean);
};

const normalizeFaqs = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => ({
      question: trim(item?.question),
      answer: trim(item?.answer),
      sortOrder: Number(item?.sortOrder) || index,
    }))
    .filter((item) => item.question && item.answer);
};

const normalizeServiceHighlights = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      const iconKey = slugify(item?.iconKey);
      if (iconKey && !ALLOWED_ICON_KEYS.has(iconKey)) {
        throw new ApiError(422, "INVALID_ICON_KEY", `Unsupported icon key: ${item?.iconKey}`);
      }

      return {
        title: trim(item?.title),
        description: trim(item?.description),
        iconKey,
        sortOrder: Number(item?.sortOrder) || index,
      };
    })
    .filter((item) => item.title || item.description);
};

const normalizeRequiredDocs = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          name: trim(item),
          description: "",
          isMandatory: true,
          allowedFileTypes: [],
          maxFiles: 1,
          sortOrder: index,
        };
      }

      const allowedFileTypes = normalizeStringArray(item?.allowedFileTypes).map((fileType) => fileType.toLowerCase());
      if (allowedFileTypes.some((fileType) => !ALLOWED_FILE_TYPES.has(fileType))) {
        throw new ApiError(
          422,
          "INVALID_FILE_TYPE",
          "requiredDocs.allowedFileTypes contains unsupported mime type"
        );
      }

      return {
        name: trim(item?.name),
        description: trim(item?.description),
        isMandatory: item?.isMandatory !== false,
        allowedFileTypes,
        maxFiles: Math.max(1, Number(item?.maxFiles) || 1),
        sortOrder: Number(item?.sortOrder) || index,
      };
    })
    .filter((item) => item.name);
};

const normalizeProcess = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          title: trim(item),
          description: "",
          sortOrder: index,
        };
      }

      return {
        title: trim(item?.title || item?.label),
        description: trim(item?.description),
        sortOrder: Number(item?.sortOrder) || index,
      };
    })
    .filter((item) => item.title || item.description);
};

const normalizeTimeline = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          label: trim(item),
          description: "",
          sortOrder: index,
        };
      }

      return {
        label: trim(item?.label || item?.title),
        description: trim(item?.description),
        sortOrder: Number(item?.sortOrder) || index,
      };
    })
    .filter((item) => item.label || item.description);
};

const buildCountrySlugCandidates = (countrySlug = "") => {
  const normalized = slugify(countrySlug);
  const compact = normalized.replace(/-/g, "");
  const candidates = new Set([normalized, compact]);

  if (["uk", "united-kingdom", "unitedkingdom", "great-britain", "greatbritain"].includes(normalized)) {
    candidates.add("uk");
    candidates.add("united-kingdom");
    candidates.add("unitedkingdom");
  }

  if (["usa", "us", "united-states", "unitedstates", "united-states-of-america"].includes(normalized)) {
    candidates.add("usa");
    candidates.add("united-states");
    candidates.add("unitedstates");
  }

  if (["new-zealand", "newzealand"].includes(normalized)) {
    candidates.add("new-zealand");
    candidates.add("newzealand");
  }

  return Array.from(candidates).filter(Boolean);
};

const buildVisaTypeSlugCandidates = (visaTypeSlug = "") => {
  const normalized = slugify(visaTypeSlug);
  const candidates = new Set([normalized]);

  if (normalized.endsWith("-visa")) {
    candidates.add(normalized.replace(/-visa$/, ""));
  } else if (normalized) {
    candidates.add(`${normalized}-visa`);
  }

  return Array.from(candidates).filter(Boolean);
};

const toSeedVisaTypePayload = (item, index) => ({
  _id: `seed-${slugify(item.countrySlug)}-${slugify(item.visaTypeSlug)}-${index}`,
  countryId: null,
  visaCategoryId: null,
  countrySlug: slugify(item.countrySlug),
  visaTypeSlug: slugify(item.visaTypeSlug),
  countryName: trim(item.countryName) || trim(item.countrySlug),
  visaTypeName: trim(item.visaTypeName) || trim(item.visaTypeSlug),
  title: trim(item.title),
  badge: trim(item.badge),
  subtitle: trim(item.subtitle),
  heroImage: trim(item.heroImage),
  iconKey: slugify(item.iconKey || "plane"),
  overview: trim(item.overview),
  serviceHighlights: normalizeServiceHighlights(item.serviceHighlights),
  eligibility: normalizeStringArray(item.eligibility),
  requiredDocs: normalizeRequiredDocs(item.requiredDocs),
  process: normalizeProcess(item.process),
  timeline: normalizeTimeline(item.timeline),
  faqs: normalizeFaqs(item.faqs),
  ctaTitle: trim(item.ctaTitle),
  ctaText: trim(item.ctaText),
  seoTitle: trim(item.seoTitle),
  seoDescription: trim(item.seoDescription),
  metaKeywords: normalizeStringArray(item.metaKeywords),
  isActive: item.isActive !== false,
  isFeatured: Boolean(item.isFeatured),
  sortOrder: Number(item.sortOrder) || 0,
  applicationEnabled: true,
  consultationEnabled: true,
});

const SEED_VISA_TYPE_ITEMS = (Array.isArray(visaTypesSeed) ? visaTypesSeed : []).map((item, index) =>
  toSeedVisaTypePayload(item, index)
);

const SEED_COUNTRY_ITEMS = Array.from(
  SEED_VISA_TYPE_ITEMS.reduce((accumulator, item) => {
    if (!accumulator.has(item.countrySlug)) {
      accumulator.set(item.countrySlug, {
        _id: `seed-country-${item.countrySlug}`,
        name: item.countryName,
        slug: item.countrySlug,
        code: "",
        flagImage: "",
        heroImage: "",
        description: "",
        isActive: true,
        sortOrder: item.sortOrder || 0,
        createdAt: null,
        updatedAt: null,
      });
    }
    return accumulator;
  }, new Map()).values()
);

const matchSeedCountry = (countrySlugCandidates = []) => {
  const variants = new Set(countrySlugCandidates);
  return SEED_COUNTRY_ITEMS.find((item) => variants.has(item.slug) || variants.has(item.slug.replace(/-/g, ""))) || null;
};

const matchSeedVisaTypesByCountry = (countrySlugCandidates = []) => {
  const variants = new Set(countrySlugCandidates);
  return SEED_VISA_TYPE_ITEMS.filter(
    (item) => variants.has(item.countrySlug) || variants.has(item.countrySlug.replace(/-/g, ""))
  );
};

const matchSeedVisaType = (countrySlugCandidates = [], visaTypeSlugCandidates = []) => {
  const countryVariants = new Set(countrySlugCandidates);
  const visaTypeVariants = new Set(visaTypeSlugCandidates);

  return (
    SEED_VISA_TYPE_ITEMS.find((item) => {
      const countryMatch =
        countryVariants.has(item.countrySlug) || countryVariants.has(item.countrySlug.replace(/-/g, ""));
      const visaTypeMatch =
        visaTypeVariants.has(item.visaTypeSlug) || visaTypeVariants.has(item.visaTypeSlug.replace(/-/g, ""));
      return countryMatch && visaTypeMatch;
    }) || null
  );
};

const hasOwn = (payload, key) => Object.prototype.hasOwnProperty.call(payload || {}, key);

const buildCountryPayload = (item) => ({
  _id: item._id,
  name: item.name,
  slug: item.slug,
  code: item.code || "",
  flagImage: item.flagImage || "",
  heroImage: item.heroImage || item.imageUrl || "",
  description: item.description || "",
  isActive: item.isActive !== false,
  sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : Number(item.ranking) || 0,
  updatedAt: item.updatedAt,
  createdAt: item.createdAt,
});

const buildVisaCategoryPayload = (item) => ({
  _id: item._id,
  name: item.name,
  slug: item.slug,
  description: item.description || "",
  iconKey: item.iconKey || "",
  isActive: item.isActive !== false,
  sortOrder: Number(item.sortOrder) || 0,
  updatedAt: item.updatedAt,
  createdAt: item.createdAt,
});

const buildCountryVisaTypePayload = (item, options = {}) => {
  const source = item?.toObject ? item.toObject() : item;
  const includeAdminFields = Boolean(options.includeAdminFields);
  const publicPayload = {
    _id: source._id,
    countryId: source.countryId?._id || source.countryId || null,
    visaCategoryId: source.visaCategoryId?._id || source.visaCategoryId || null,
    countrySlug: source.countrySlug,
    visaTypeSlug: source.visaTypeSlug,
    countryName: source.countryName || source.countryId?.name || "",
    visaTypeName: source.visaTypeName || source.visaCategoryId?.name || "",
    title: source.title,
    badge: source.badge || "",
    subtitle: source.subtitle || "",
    heroImage: source.heroImage || "",
    iconKey: source.iconKey || source.visaCategoryId?.iconKey || "",
    overview: source.overview || "",
    serviceHighlights: Array.isArray(source.serviceHighlights) ? source.serviceHighlights : [],
    eligibility: normalizeStringArray(source.eligibility),
    requiredDocs: Array.isArray(source.requiredDocs) ? source.requiredDocs : [],
    process: Array.isArray(source.process) ? source.process : [],
    timeline: Array.isArray(source.timeline) ? source.timeline : [],
    faqs: Array.isArray(source.faqs) ? source.faqs : [],
    ctaTitle: source.ctaTitle || "",
    ctaText: source.ctaText || "",
    seoTitle: source.seoTitle || "",
    seoDescription: source.seoDescription || "",
    metaKeywords: normalizeStringArray(source.metaKeywords),
    isActive: source.isActive !== false,
    isFeatured: Boolean(source.isFeatured),
    sortOrder: Number(source.sortOrder) || 0,
    applicationEnabled: source.applicationEnabled !== false,
    consultationEnabled: source.consultationEnabled !== false,
  };

  if (!includeAdminFields) {
    return publicPayload;
  }

  return {
    ...publicPayload,
    country: source.countryId
      ? {
          _id: source.countryId._id,
          name: source.countryId.name,
          slug: source.countryId.slug,
        }
      : null,
    visaCategory: source.visaCategoryId
      ? {
          _id: source.visaCategoryId._id,
          name: source.visaCategoryId.name,
          slug: source.visaCategoryId.slug,
          iconKey: source.visaCategoryId.iconKey || "",
        }
      : null,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};

const generateYearlyNumber = async ({ model, fieldName, prefix, padding = 6 }) => {
  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}-${year}-`;
  const regex = new RegExp(`^${prefix}-${year}-\\d+$`);

  const latest = await model.findOne({ [fieldName]: regex }).sort({ [fieldName]: -1 }).select(fieldName).lean();

  let nextNumber = 1;
  if (latest?.[fieldName]) {
    const parts = String(latest[fieldName]).split("-");
    const numeric = Number(parts[parts.length - 1]);
    if (Number.isFinite(numeric) && numeric > 0) {
      nextNumber = numeric + 1;
    }
  }

  return `${yearPrefix}${String(nextNumber).padStart(padding, "0")}`;
};

const ensureUserForApplication = async (payload, actorUserId = null) => {
  if (actorUserId) {
    const actor = await User.findById(actorUserId);
    if (!actor || actor.isDeleted || !actor.isActive) {
      throw new ApiError(401, "UNAUTHORIZED", "Authenticated user not found or inactive");
    }
    return actor;
  }

  const email = trim(payload?.applicantDetails?.email || payload.email).toLowerCase();
  if (!email) {
    throw new ApiError(422, "VALIDATION_ERROR", "Applicant email is required for guest application");
  }

  let user = await User.findOne({ email });
  if (user) {
    if (!user.isActive || user.isDeleted) {
      throw new ApiError(403, "ACCOUNT_INACTIVE", "Applicant account is inactive");
    }
    return user;
  }

  const firstName = trim(payload?.applicantDetails?.firstName || payload.firstName || payload.fullName || "Applicant");
  const lastName = trim(payload?.applicantDetails?.lastName || payload.lastName || "User");
  const phone = trim(payload?.applicantDetails?.phone || payload.phone);

  user = await User.create({
    firstName: firstName || "Applicant",
    lastName: lastName || "User",
    email,
    phone,
    password: `Temp@${Date.now()}Aa1`,
    role: "customer",
    isEmailVerified: false,
  });

  return user;
};

const getCountryVisaTypeForApplication = async (payload) => {
  if (payload.countryVisaTypeId) {
    const found = await CountryVisaType.findById(payload.countryVisaTypeId)
      .populate("countryId", "name slug isActive")
      .populate("visaCategoryId", "name slug iconKey")
      .lean();

    if (!found) {
      throw new ApiError(404, "COUNTRY_VISA_TYPE_NOT_FOUND", "Selected visa type configuration not found");
    }

    if (!found.countryId || found.countryId.isActive === false) {
      throw new ApiError(422, "COUNTRY_INACTIVE", "Selected country is inactive");
    }

    if (!found.isActive) {
      throw new ApiError(422, "COUNTRY_VISA_TYPE_INACTIVE", "Selected visa type is inactive");
    }

    return found;
  }

  const countrySlug = slugify(payload.countrySlug || payload.country || payload.destinationCountry);
  const visaTypeSlug = slugify(payload.visaTypeSlug || payload.visaType || payload.visaCategory);

  if (!countrySlug || !visaTypeSlug) {
    throw new ApiError(422, "VALIDATION_ERROR", "countrySlug and visaTypeSlug are required");
  }

  const countrySlugCandidates = buildCountrySlugCandidates(countrySlug);
  const visaTypeSlugCandidates = buildVisaTypeSlugCandidates(visaTypeSlug);

  const country = await Country.findOne({
    slug: { $in: countrySlugCandidates },
    isActive: true,
  })
    .select("_id name slug")
    .lean();

  if (!country) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  const found = await CountryVisaType.findOne({
    countryId: country._id,
    countrySlug: { $in: countrySlugCandidates },
    visaTypeSlug: { $in: visaTypeSlugCandidates },
    isActive: true,
  })
    .populate("countryId", "name slug isActive")
    .populate("visaCategoryId", "name slug iconKey")
    .lean();

  if (!found) {
    throw new ApiError(404, "COUNTRY_VISA_TYPE_NOT_FOUND", "Selected visa type configuration not found");
  }

  return found;
};

const normalizeSubmittedDocName = (value) => slugify(value).replace(/-/g, "");

const isMandatoryDocMatched = (requiredDoc, submittedDoc) => {
  const requiredName = normalizeSubmittedDocName(requiredDoc?.name || "");
  const candidate = normalizeSubmittedDocName(submittedDoc?.docName || submittedDoc?.fieldname || "");

  if (!requiredName || !candidate) {
    return false;
  }

  return candidate.includes(requiredName) || requiredName.includes(candidate);
};

const uploadApplicationFiles = async (files, countrySlug, visaTypeSlug) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const uploaded = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const uploadResult = await uploadDocumentBuffer(
      file.buffer,
      file.mimetype,
      `y-axis/visa-applications/${countrySlug}/${visaTypeSlug}`
    );

    uploaded.push({
      fieldname: file.fieldname,
      docName: trim(file.fieldname).replace(/^documents?\.?/i, "") || trim(file.originalname),
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
      verificationStatus: "pending",
      adminRemark: "",
    });
  }

  return uploaded;
};

const getPublicSiteSettings = async () => {
  const settingKeys = Object.values(PUBLIC_SITE_SETTING_KEYS);
  const items = await Setting.find({ key: { $in: settingKeys } }).select("key value").lean();

  const valueMap = new Map(items.map((item) => [item.key, item.value]));

  const values = {
    siteName: trim(valueMap.get(PUBLIC_SITE_SETTING_KEYS.siteName) || PUBLIC_SITE_SETTINGS_DEFAULTS.siteName),
    siteTagline: trim(valueMap.get(PUBLIC_SITE_SETTING_KEYS.siteTagline) || PUBLIC_SITE_SETTINGS_DEFAULTS.siteTagline),
    siteLogoUrl: trim(valueMap.get(PUBLIC_SITE_SETTING_KEYS.siteLogoUrl) || PUBLIC_SITE_SETTINGS_DEFAULTS.siteLogoUrl),
    supportPhone: trim(valueMap.get(PUBLIC_SITE_SETTING_KEYS.supportPhone) || PUBLIC_SITE_SETTINGS_DEFAULTS.supportPhone),
    whatsappNumber: trim(
      valueMap.get(PUBLIC_SITE_SETTING_KEYS.whatsappNumber) || PUBLIC_SITE_SETTINGS_DEFAULTS.whatsappNumber
    ),
    homeBannerTitle: trim(
      valueMap.get(PUBLIC_SITE_SETTING_KEYS.homeBannerTitle) || PUBLIC_SITE_SETTINGS_DEFAULTS.homeBannerTitle
    ),
    homeBannerSubtitle: trim(
      valueMap.get(PUBLIC_SITE_SETTING_KEYS.homeBannerSubtitle) || PUBLIC_SITE_SETTINGS_DEFAULTS.homeBannerSubtitle
    ),
    homeBannerImageUrl: trim(
      valueMap.get(PUBLIC_SITE_SETTING_KEYS.homeBannerImageUrl) || PUBLIC_SITE_SETTINGS_DEFAULTS.homeBannerImageUrl
    ),
  };

  return { values };
};

const buildApplicantDetails = (payload) => {
  const parsed = parseIfJson(payload.applicantDetails, payload.applicantDetails || {});
  const fullName = trim(payload.fullName || "");
  const [firstNameFromFull, ...rest] = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName: trim(parsed.firstName || payload.firstName || firstNameFromFull),
    lastName: trim(parsed.lastName || payload.lastName || rest.join(" ")),
    dob: parsed.dob || payload.dob || null,
    gender: trim(parsed.gender || payload.gender),
    email: trim(parsed.email || payload.email).toLowerCase(),
    phone: trim(parsed.phone || payload.phone),
    nationality: trim(parsed.nationality || payload.nationality),
    passportNumber: trim(parsed.passportNumber || payload.passportNumber),
    maritalStatus: trim(parsed.maritalStatus || payload.maritalStatus),
    address: trim(parsed.address || payload.address),
    travelDate: parsed.travelDate || payload.travelDate || null,
    educationDetails: parsed.educationDetails || parseIfJson(payload.educationDetails, {}),
    employmentDetails: parsed.employmentDetails || parseIfJson(payload.employmentDetails, {}),
    dependentDetails: parsed.dependentDetails || parseIfJson(payload.dependentDetails, {}),
    customFields: parsed.customFields || parseIfJson(payload.customFields, {}),
  };
};

const normalizeCountryPayload = (payload = {}, actorId = null, options = {}) => {
  const isUpdate = Boolean(options.isUpdate);
  const updates = {};

  if (hasOwn(payload, "name")) {
    updates.name = trim(payload.name);
  }

  if (hasOwn(payload, "slug")) {
    updates.slug = slugify(payload.slug);
  } else if (!isUpdate && updates.name) {
    updates.slug = slugify(updates.name);
  }

  if (!isUpdate) {
    if (!updates.name) {
      throw new ApiError(422, "VALIDATION_ERROR", "name is required");
    }
    if (!updates.slug) {
      throw new ApiError(422, "VALIDATION_ERROR", "slug is required");
    }
  }

  if (hasOwn(payload, "code")) {
    updates.code = trim(payload.code).toUpperCase();
  }

  if (hasOwn(payload, "flagImage")) {
    updates.flagImage = trim(payload.flagImage);
  }

  if (hasOwn(payload, "heroImage")) {
    updates.heroImage = trim(payload.heroImage);
    updates.imageUrl = updates.heroImage;
  }

  if (hasOwn(payload, "description")) {
    updates.description = trim(payload.description);
  }

  if (hasOwn(payload, "isActive")) {
    updates.isActive = Boolean(payload.isActive);
  }

  if (hasOwn(payload, "sortOrder")) {
    updates.sortOrder = Number(payload.sortOrder) || 0;
    updates.ranking = updates.sortOrder;
  }

  if (hasOwn(payload, "region")) {
    updates.region = trim(payload.region);
  }

  if (hasOwn(payload, "isFeatured")) {
    updates.isFeatured = Boolean(payload.isFeatured);
  }

  if (actorId) {
    updates.updatedBy = actorId;
  }

  if (!isUpdate && actorId) {
    updates.createdBy = actorId;
  }

  return updates;
};

const normalizeVisaCategoryPayload = (payload = {}, actorId = null, options = {}) => {
  const isUpdate = Boolean(options.isUpdate);
  const updates = {};

  if (hasOwn(payload, "name")) {
    updates.name = trim(payload.name);
  }

  if (hasOwn(payload, "slug")) {
    updates.slug = slugify(payload.slug);
  } else if (!isUpdate && updates.name) {
    updates.slug = slugify(updates.name);
  }

  if (!isUpdate) {
    if (!updates.name) {
      throw new ApiError(422, "VALIDATION_ERROR", "name is required");
    }

    if (!updates.slug) {
      throw new ApiError(422, "VALIDATION_ERROR", "slug is required");
    }
  }

  if (hasOwn(payload, "description")) {
    updates.description = trim(payload.description);
  }

  if (hasOwn(payload, "iconKey")) {
    const normalized = slugify(payload.iconKey);
    if (normalized && !ALLOWED_ICON_KEYS.has(normalized)) {
      throw new ApiError(422, "INVALID_ICON_KEY", `Unsupported icon key: ${payload.iconKey}`);
    }
    updates.iconKey = normalized;
  }

  if (hasOwn(payload, "isActive")) {
    updates.isActive = Boolean(payload.isActive);
  }

  if (hasOwn(payload, "sortOrder")) {
    updates.sortOrder = Number(payload.sortOrder) || 0;
  }

  if (actorId) {
    updates.updatedBy = actorId;
  }

  if (!isUpdate && actorId) {
    updates.createdBy = actorId;
  }

  return updates;
};

const resolveCountryVisaTypeRelations = async (payload) => {
  let country = null;
  let visaCategory = null;

  if (payload.countryId) {
    country = await Country.findById(payload.countryId);
  }

  if (!country && payload.countrySlug) {
    country = await Country.findOne({ slug: slugify(payload.countrySlug) });
  }

  if (!country && payload.countryName) {
    country = await Country.findOne({ name: new RegExp(`^${trim(payload.countryName)}$`, "i") });
  }

  if (!country) {
    throw new ApiError(422, "VALIDATION_ERROR", "A valid country is required");
  }

  if (payload.visaCategoryId) {
    visaCategory = await VisaCategory.findById(payload.visaCategoryId);
  }

  if (!visaCategory && payload.visaTypeSlug) {
    visaCategory = await VisaCategory.findOne({ slug: slugify(payload.visaTypeSlug) });
  }

  if (!visaCategory && payload.visaTypeName) {
    visaCategory = await VisaCategory.findOne({ name: new RegExp(`^${trim(payload.visaTypeName)}$`, "i") });
  }

  if (!visaCategory && payload.visaTypeName) {
    visaCategory = await VisaCategory.create({
      name: trim(payload.visaTypeName),
      slug: slugify(payload.visaTypeSlug || payload.visaTypeName),
      isActive: true,
      sortOrder: 0,
    });
  }

  if (!visaCategory) {
    throw new ApiError(422, "VALIDATION_ERROR", "A valid visa category is required");
  }

  return { country, visaCategory };
};

const normalizeCountryVisaTypePayload = async (payload = {}, actorId = null, options = {}) => {
  const isUpdate = Boolean(options.isUpdate);
  const updates = {};

  const { country, visaCategory } = await resolveCountryVisaTypeRelations(payload);

  updates.countryId = country._id;
  updates.visaCategoryId = visaCategory._id;
  updates.countrySlug = country.slug;
  updates.countryName = country.name;
  updates.visaTypeSlug = visaCategory.slug;
  updates.visaTypeName = visaCategory.name;

  if (hasOwn(payload, "title")) {
    updates.title = trim(payload.title);
  }

  if (!isUpdate && !updates.title) {
    updates.title = `${country.name} ${visaCategory.name}`;
  }

  if (!isUpdate && !updates.title) {
    throw new ApiError(422, "VALIDATION_ERROR", "title is required");
  }

  if (hasOwn(payload, "badge")) {
    updates.badge = trim(payload.badge);
  }

  if (hasOwn(payload, "subtitle")) {
    updates.subtitle = trim(payload.subtitle);
  }

  if (hasOwn(payload, "heroImage")) {
    updates.heroImage = trim(payload.heroImage);
  }

  if (hasOwn(payload, "iconKey")) {
    const normalized = slugify(payload.iconKey);
    if (normalized && !ALLOWED_ICON_KEYS.has(normalized)) {
      throw new ApiError(422, "INVALID_ICON_KEY", `Unsupported icon key: ${payload.iconKey}`);
    }
    updates.iconKey = normalized;
  }

  if (hasOwn(payload, "overview")) {
    updates.overview = trim(payload.overview);
  }

  if (hasOwn(payload, "serviceHighlights")) {
    updates.serviceHighlights = normalizeServiceHighlights(parseIfJson(payload.serviceHighlights, payload.serviceHighlights));
  }

  if (hasOwn(payload, "eligibility")) {
    updates.eligibility = normalizeStringArray(parseIfJson(payload.eligibility, payload.eligibility));
  }

  if (hasOwn(payload, "requiredDocs")) {
    updates.requiredDocs = normalizeRequiredDocs(parseIfJson(payload.requiredDocs, payload.requiredDocs));
  }

  if (hasOwn(payload, "process")) {
    updates.process = normalizeProcess(parseIfJson(payload.process, payload.process));
  }

  if (hasOwn(payload, "timeline")) {
    updates.timeline = normalizeTimeline(parseIfJson(payload.timeline, payload.timeline));
  }

  if (hasOwn(payload, "faqs")) {
    updates.faqs = normalizeFaqs(parseIfJson(payload.faqs, payload.faqs));
  }

  if (hasOwn(payload, "ctaTitle")) {
    updates.ctaTitle = trim(payload.ctaTitle);
  }

  if (hasOwn(payload, "ctaText")) {
    updates.ctaText = trim(payload.ctaText);
  }

  if (hasOwn(payload, "seoTitle")) {
    updates.seoTitle = trim(payload.seoTitle);
  }

  if (hasOwn(payload, "seoDescription")) {
    updates.seoDescription = trim(payload.seoDescription);
  }

  if (hasOwn(payload, "metaKeywords")) {
    updates.metaKeywords = normalizeStringArray(parseIfJson(payload.metaKeywords, payload.metaKeywords));
  }

  if (hasOwn(payload, "isActive")) {
    updates.isActive = Boolean(payload.isActive);
  }

  if (hasOwn(payload, "isFeatured")) {
    updates.isFeatured = Boolean(payload.isFeatured);
  }

  if (hasOwn(payload, "sortOrder")) {
    updates.sortOrder = Number(payload.sortOrder) || 0;
  }

  if (hasOwn(payload, "applicationEnabled")) {
    updates.applicationEnabled = Boolean(payload.applicationEnabled);
  }

  if (hasOwn(payload, "consultationEnabled")) {
    updates.consultationEnabled = Boolean(payload.consultationEnabled);
  }

  if (actorId) {
    updates.updatedBy = actorId;
  }

  if (!isUpdate && actorId) {
    updates.createdBy = actorId;
  }

  return updates;
};

const createVisaApplication = async ({
  payload,
  files = [],
  actorUserId = null,
  source = "website",
  requireAuthenticatedUser = false,
}) => {
  if (requireAuthenticatedUser && !actorUserId) {
    throw new ApiError(401, "UNAUTHORIZED", "Please login or register before submitting a visa application.");
  }

  const countryVisaType = await getCountryVisaTypeForApplication(payload);

  if (!countryVisaType.applicationEnabled) {
    throw new ApiError(422, "APPLICATION_DISABLED", "Application is disabled for the selected visa type");
  }

  const user = await ensureUserForApplication(payload, actorUserId);
  const applicantDetails = buildApplicantDetails(payload);

  const uploadedDocs = await uploadApplicationFiles(files, countryVisaType.countrySlug, countryVisaType.visaTypeSlug);

  const parsedSubmittedDocs = parseIfJson(payload.submittedDocs, []);
  const manuallySubmittedDocs = Array.isArray(parsedSubmittedDocs)
    ? parsedSubmittedDocs
        .map((item) => ({
          requiredDocId: item?.requiredDocId || null,
          docName: trim(item?.docName || item?.name),
          fileUrl: trim(item?.fileUrl),
          originalName: trim(item?.originalName),
          mimeType: trim(item?.mimeType),
          size: Number(item?.size) || 0,
          uploadedAt: item?.uploadedAt || new Date(),
          verificationStatus: item?.verificationStatus || "pending",
          adminRemark: trim(item?.adminRemark),
        }))
        .filter((item) => item.fileUrl)
    : [];

  const submittedDocs = [...manuallySubmittedDocs, ...uploadedDocs].map((item) => {
    const matchedDoc = (countryVisaType.requiredDocs || []).find((requiredDoc) => isMandatoryDocMatched(requiredDoc, item));

    return {
      ...item,
      requiredDocId: matchedDoc?._id || item.requiredDocId || null,
      docName: item.docName || matchedDoc?.name || item.originalName,
    };
  });

  const mandatoryDocs = (countryVisaType.requiredDocs || []).filter((doc) => doc.isMandatory !== false);
  const missingMandatory = mandatoryDocs.filter(
    (requiredDoc) => !submittedDocs.some((submittedDoc) => isMandatoryDocMatched(requiredDoc, submittedDoc))
  );

  if (missingMandatory.length > 0) {
    throw new ApiError(
      422,
      "MISSING_REQUIRED_DOCUMENTS",
      `Missing mandatory documents: ${missingMandatory.map((item) => item.name).join(", ")}`
    );
  }

  const requestedStatus = trim(payload.status);
  const status = actorUserId && VISA_APPLICATION_STATUSES.includes(requestedStatus) ? requestedStatus : "submitted";

  let created = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const applicationNumber = await generateYearlyNumber({
      model: VisaApplication,
      fieldName: "applicationNumber",
      prefix: "VISA",
      padding: 6,
    });

    try {
      created = await VisaApplication.create({
        applicationNumber,
        userId: user._id,
        countryId: countryVisaType.countryId?._id || countryVisaType.countryId,
        visaCategoryId: countryVisaType.visaCategoryId?._id || countryVisaType.visaCategoryId,
        countryVisaTypeId: countryVisaType._id,
        countrySlug: countryVisaType.countrySlug,
        visaTypeSlug: countryVisaType.visaTypeSlug,
        status,
        statusHistory: [
          {
            status,
            note: trim(payload.initialNote) || "Application created",
            updatedBy: actorUserId || null,
            updatedAt: new Date(),
          },
        ],
        adminNotes: "",
        applicantDetails,
        submittedDocs,
        paymentStatus: payload.paymentStatus || "not_required",
        source,
        isArchived: false,
        appliedAt: new Date(),
      });
      break;
    } catch (error) {
      if (error?.code === 11000 && attempt < 4) {
        continue;
      }
      throw error;
    }
  }

  try {
    await sendAdminFormNotification({
      formType: "visa_application",
      data: {
        applicationNumber: created?.applicationNumber,
        countrySlug: created?.countrySlug,
        visaTypeSlug: created?.visaTypeSlug,
        status: created?.status,
        paymentStatus: created?.paymentStatus,
        source: created?.source,
        consentAccepted: payload?.consentAccepted,
        disclaimerAccepted: payload?.disclaimerAccepted,
        refundPolicyAccepted: payload?.refundPolicyAccepted,
        applicantDetails,
      },
      record: created,
      meta: {
        sourceRoute: source === "dashboard" ? "/api/v1/user/applications" : "/api/v1/public/visa-applications",
        sourcePage: trim(payload?.pageSource),
        replyTo: applicantDetails?.email,
        files: submittedDocs,
      },
    });
  } catch (mailError) {
    console.error("[FORM_MAIL] Failed to send visa application notification", {
      error: mailError.message,
      recordId: String(created?._id || ""),
      formType: "visa_application",
    });
  }

  return created;
};

const uploadAdminSiteAsset = async (file, actorId = null) => {
  if (!file) {
    throw new ApiError(422, "VALIDATION_ERROR", "File is required");
  }

  if (!String(file.mimetype || "").startsWith("image/")) {
    throw new ApiError(422, "INVALID_FILE_TYPE", "Only image files are allowed for site assets");
  }

  const uploadResult = await uploadDocumentBuffer(file.buffer, file.mimetype, "y-axis/site-settings");

  return {
    fileUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedBy: actorId || null,
  };
};

const uploadUserAvatar = async (userId, file) => {
  if (!file) {
    throw new ApiError(422, "VALIDATION_ERROR", "Avatar file is required");
  }

  if (!String(file.mimetype || "").startsWith("image/")) {
    throw new ApiError(422, "INVALID_FILE_TYPE", "Only image files are allowed for avatars");
  }

  const uploadResult = await uploadDocumentBuffer(file.buffer, file.mimetype, `y-axis/users/${userId}/avatar`);

  const user = await User.findByIdAndUpdate(
    userId,
    { avatarUrl: uploadResult.secure_url },
    { new: true, runValidators: true }
  )
    .select("firstName lastName fullName email phone role country profile avatarUrl isActive")
    .lean();

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return user;
};

const ensureOwnershipOfApplication = async (applicationId, userId) => {
  const application = await VisaApplication.findById(applicationId);
  if (!application) {
    throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found");
  }

  if (String(application.userId) !== String(userId)) {
    throw new ApiError(403, "FORBIDDEN", "You can access only your own applications");
  }

  return application;
};

const uploadTicketFiles = async (files, userId) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const attachments = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    const uploadResult = await uploadDocumentBuffer(file.buffer, file.mimetype, `y-axis/support-tickets/${userId}`);

    attachments.push({
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
  }

  return attachments;
};

const parseAttachmentUrls = (value) => {
  const parsed = parseIfJson(value, value);

  let rawValues = [];
  if (Array.isArray(parsed)) {
    rawValues = parsed;
  } else if (typeof parsed === "string") {
    rawValues = parsed.split(/[\n,]/g);
  }

  const unique = new Set();
  for (const candidate of rawValues) {
    const normalized = trim(candidate);
    if (!normalized) {
      continue;
    }

    let parsedUrl = null;
    try {
      parsedUrl = new URL(normalized);
    } catch (_error) {
      parsedUrl = null;
    }

    if (!parsedUrl || !["http:", "https:"].includes(parsedUrl.protocol)) {
      continue;
    }

    unique.add(parsedUrl.toString());
  }

  return Array.from(unique);
};

const buildUrlAttachments = (urls = []) => {
  if (!Array.isArray(urls) || urls.length === 0) {
    return [];
  }

  return urls.map((fileUrl) => {
    let originalName = "External link";

    try {
      const parsedUrl = new URL(fileUrl);
      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      originalName = decodeURIComponent(segments[segments.length - 1] || parsedUrl.hostname || "External link");
    } catch (_error) {
      originalName = "External link";
    }

    return {
      fileUrl,
      publicId: "",
      originalName,
      mimeType: "url",
      size: 0,
    };
  });
};

const listPublicCountries = async (query = {}) => {
  const filter = {
    isActive: true,
  };

  const applyEnabledOnly = parseQueryBoolean(query.applicationEnabled ?? query.forApplication);
  if (applyEnabledOnly === true) {
    const eligibleCountryIds = await CountryVisaType.distinct("countryId", {
      isActive: true,
      applicationEnabled: true,
      countryId: { $ne: null },
    });

    if (eligibleCountryIds.length === 0) {
      return [];
    }

    filter._id = { $in: eligibleCountryIds };
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { slug: { $regex: query.search, $options: "i" } },
      { code: { $regex: query.search, $options: "i" } },
    ];
  }

  const items = await Country.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  return items.map(buildCountryPayload);
};

const getPublicCountryBySlug = async (countrySlug) => {
  const countrySlugCandidates = buildCountrySlugCandidates(countrySlug);
  const country = await Country.findOne({ slug: { $in: countrySlugCandidates }, isActive: true }).lean();
  if (!country) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  return buildCountryPayload(country);
};

const listPublicVisaTypesByCountry = async (countrySlug, query = {}) => {
  const countrySlugCandidates = buildCountrySlugCandidates(countrySlug);
  const country = await Country.findOne({ slug: { $in: countrySlugCandidates }, isActive: true }).lean();

  if (!country) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  const filter = {
    countrySlug: { $in: countrySlugCandidates },
    isActive: true,
  };

  const applicationEnabled = parseQueryBoolean(query.applicationEnabled);
  if (applicationEnabled !== undefined) {
    filter.applicationEnabled = applicationEnabled;
  }

  const consultationEnabled = parseQueryBoolean(query.consultationEnabled);
  if (consultationEnabled !== undefined) {
    filter.consultationEnabled = consultationEnabled;
  }

  const items = await CountryVisaType.find(filter)
    .populate("visaCategoryId", "name slug iconKey")
    .sort({ sortOrder: 1, updatedAt: -1 })
    .lean();

  const dbItems = items.map((item) => buildCountryVisaTypePayload(item));

  return dbItems.sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.title || "").localeCompare(String(b.title || ""))
  );
};

const getPublicVisaTypeContent = async (countrySlug, visaTypeSlug) => {
  const countrySlugCandidates = buildCountrySlugCandidates(countrySlug);
  const visaTypeSlugCandidates = buildVisaTypeSlugCandidates(visaTypeSlug);

  const country = await Country.findOne({
    slug: { $in: countrySlugCandidates },
    isActive: true,
  })
    .select("_id name slug")
    .lean();

  if (!country) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  const item = await CountryVisaType.findOne({
    countryId: country._id,
    countrySlug: { $in: countrySlugCandidates },
    visaTypeSlug: { $in: visaTypeSlugCandidates },
    isActive: true,
  })
    .populate("countryId", "name slug")
    .populate("visaCategoryId", "name slug iconKey")
    .lean();

  if (!item) {
    throw new ApiError(404, "VISA_TYPE_NOT_FOUND", "Visa type not found");
  }

  return buildCountryVisaTypePayload(item);
};

const getPublicApplicationConfig = async (countrySlug, visaTypeSlug) => {
  const item = await getPublicVisaTypeContent(countrySlug, visaTypeSlug);

  if (!item.applicationEnabled) {
    throw new ApiError(422, "APPLICATION_DISABLED", "Application flow is disabled for this visa type");
  }

  return {
    countrySlug: item.countrySlug,
    visaTypeSlug: item.visaTypeSlug,
    title: item.title,
    subtitle: item.subtitle || "",
    summary: item.overview || item.subtitle || "",
    requiredDocs: Array.isArray(item.requiredDocs) ? item.requiredDocs : [],
    applicantFields: [
      { key: "firstName", label: "First Name", type: "text", required: true },
      { key: "lastName", label: "Last Name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Phone", type: "text", required: true },
      { key: "nationality", label: "Nationality", type: "text", required: true },
      { key: "passportNumber", label: "Passport Number", type: "text", required: false },
      { key: "address", label: "Address", type: "textarea", required: false },
    ],
    applicationEnabled: item.applicationEnabled !== false,
    consultationEnabled: item.consultationEnabled !== false,
  };
};

const searchPublicVisaTypes = async (query = {}) => {
  const filter = { isActive: true };
  const countrySlugCandidates = query.country ? buildCountrySlugCandidates(query.country) : [];
  const visaTypeSlugCandidates = query.type ? buildVisaTypeSlugCandidates(query.type) : [];

  const activeCountries = await Country.find({ isActive: true }).select("slug").lean();
  const activeCountrySlugs = activeCountries.map((item) => item.slug).filter(Boolean);
  if (activeCountrySlugs.length === 0) {
    return [];
  }

  filter.countrySlug = { $in: activeCountrySlugs };

  if (query.country) {
    filter.countrySlug = {
      $in: countrySlugCandidates.filter((slug) => activeCountrySlugs.includes(slug)),
    };
  }

  if (query.type) {
    filter.visaTypeSlug = { $in: visaTypeSlugCandidates };
  }

  const items = await CountryVisaType.find(filter)
    .select("countrySlug visaTypeSlug countryName visaTypeName title subtitle iconKey badge sortOrder")
    .sort({ sortOrder: 1, title: 1 })
    .lean();

  const dbItems = items.map((item) => buildCountryVisaTypePayload(item));

  return dbItems.sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.title || "").localeCompare(String(b.title || ""))
  );
};

const createPublicEnquiry = async (payload, actorUserId = null) => {
  const userId = actorUserId || null;

  let created = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const enquiryNumber = await generateYearlyNumber({
      model: Enquiry,
      fieldName: "enquiryNumber",
      prefix: "ENQ",
      padding: 6,
    });

    try {
      created = await Enquiry.create({
        enquiryNumber,
        userId,
        name: trim(payload.name),
        email: trim(payload.email).toLowerCase(),
        phone: trim(payload.phone),
        countryOfInterest: trim(payload.countryOfInterest),
        visaInterestType: trim(payload.visaInterestType || payload.visaType),
        enquiryType: ENQUIRY_TYPES.includes(payload.enquiryType) ? payload.enquiryType : "general_visa_help",
        message: trim(payload.message),
        preferredContactMethod: trim(payload.preferredContactMethod),
        pageSource: trim(payload.pageSource),
        status: "new",
        adminNotes: "",
      });
      break;
    } catch (error) {
      if (error?.code === 11000 && attempt < 4) {
        continue;
      }
      throw error;
    }
  }

  try {
    await sendAdminFormNotification({
      formType: "public_enquiry",
      data: {
        name: created?.name,
        email: created?.email,
        phone: created?.phone,
        countryOfInterest: created?.countryOfInterest,
        visaInterestType: created?.visaInterestType,
        enquiryType: created?.enquiryType,
        message: created?.message,
        preferredContactMethod: created?.preferredContactMethod,
        pageSource: created?.pageSource,
        status: created?.status,
        enquiryNumber: created?.enquiryNumber,
      },
      record: created,
      meta: {
        sourceRoute: "/api/v1/public/enquiries",
        sourcePage: created?.pageSource,
        replyTo: created?.email,
      },
    });
  } catch (mailError) {
    console.error("[FORM_MAIL] Failed to send public enquiry notification", {
      error: mailError.message,
      recordId: String(created?._id || ""),
      formType: "public_enquiry",
    });
  }

  return created;
};

const listUserApplications = async (userId, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { userId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.countrySlug) {
    filter.countrySlug = slugify(query.countrySlug);
  }

  if (query.visaTypeSlug) {
    filter.visaTypeSlug = slugify(query.visaTypeSlug);
  }

  if (query.search) {
    filter.$or = [
      { applicationNumber: { $regex: query.search, $options: "i" } },
      { "applicantDetails.firstName": { $regex: query.search, $options: "i" } },
      { "applicantDetails.lastName": { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    VisaApplication.find(filter)
      .populate("countryId", "name slug")
      .populate("visaCategoryId", "name slug")
      .populate("countryVisaTypeId", "title countrySlug visaTypeSlug")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit),
    VisaApplication.countDocuments(filter),
  ]);

  return {
    items,
    pagination: getPaginationMeta(page, limit, total),
  };
};

const getUserApplicationById = async (userId, applicationId) => {
  const item = await VisaApplication.findOne({ _id: applicationId, userId })
    .populate("countryId", "name slug")
    .populate("visaCategoryId", "name slug")
    .populate("countryVisaTypeId", "title countrySlug visaTypeSlug requiredDocs")
    .lean();

  if (!item) {
    throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found");
  }

  return item;
};

const createUserApplication = async (userId, payload, files = []) => {
  return createVisaApplication({
    payload,
    files,
    actorUserId: userId,
    source: "dashboard",
  });
};

const listUserTickets = async (userId, query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { userId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.search) {
    filter.$or = [
      { ticketNumber: { $regex: query.search, $options: "i" } },
      { subject: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate("applicationId", "applicationNumber status countrySlug visaTypeSlug")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(filter),
  ]);

  return {
    items,
    pagination: getPaginationMeta(page, limit, total),
  };
};

const createUserTicket = async (userId, payload, files = []) => {
  if (payload.applicationId) {
    await ensureOwnershipOfApplication(payload.applicationId, userId);
  }

  const urlAttachments = buildUrlAttachments(parseAttachmentUrls(payload.attachmentUrls));
  const uploadedAttachments = await uploadTicketFiles(files, userId);
  const attachments = [...urlAttachments, ...uploadedAttachments];

  let ticketUser = null;
  if (userId) {
    ticketUser = await User.findById(userId).select("firstName lastName fullName email phone").lean();
  }

  let ticket = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ticketNumber = await generateYearlyNumber({
      model: SupportTicket,
      fieldName: "ticketNumber",
      prefix: "TKT",
      padding: 5,
    });

    try {
      ticket = await SupportTicket.create({
        ticketNumber,
        userId,
        applicationId: payload.applicationId || null,
        category: TICKET_CATEGORIES.includes(payload.category) ? payload.category : "general_support",
        subject: trim(payload.subject),
        description: trim(payload.description),
        attachments,
        status: "open",
        priority: TICKET_PRIORITIES.includes(payload.priority) ? payload.priority : "medium",
        replies: [],
        assignedTo: payload.assignedTo || null,
      });
      break;
    } catch (error) {
      if (error?.code === 11000 && attempt < 4) {
        continue;
      }
      throw error;
    }
  }

  try {
    await sendAdminFormNotification({
      formType: "user_support_ticket",
      data: {
        ticketNumber: ticket?.ticketNumber,
        applicationId: ticket?.applicationId,
        subject: ticket?.subject,
        description: ticket?.description,
        category: ticket?.category,
        priority: ticket?.priority,
        status: ticket?.status,
        fullName:
          ticketUser?.fullName || `${ticketUser?.firstName || ""} ${ticketUser?.lastName || ""}`.trim() || "",
        email: ticketUser?.email || "",
        phone: ticketUser?.phone || "",
      },
      record: ticket,
      meta: {
        sourceRoute: "/api/v1/user/tickets",
        replyTo: ticketUser?.email || undefined,
        files: attachments,
      },
    });
  } catch (mailError) {
    console.error("[FORM_MAIL] Failed to send support ticket notification", {
      error: mailError.message,
      recordId: String(ticket?._id || ""),
      formType: "user_support_ticket",
    });
  }

  return ticket;
};

const getUserTicketById = async (userId, ticketId) => {
  const ticket = await SupportTicket.findOne({ _id: ticketId, userId })
    .populate("applicationId", "applicationNumber status")
    .populate("replies.senderId", "firstName lastName email role")
    .lean();

  if (!ticket) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  return ticket;
};

const replyToUserTicket = async (userId, ticketId, payload, files = []) => {
  const ticket = await SupportTicket.findOne({ _id: ticketId, userId });
  if (!ticket) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  if (ticket.status === "closed") {
    throw new ApiError(422, "TICKET_CLOSED", "Ticket is closed");
  }

  const urlAttachments = buildUrlAttachments(parseAttachmentUrls(payload.attachmentUrls));
  const uploadedAttachments = await uploadTicketFiles(files, userId);
  const attachments = [...urlAttachments, ...uploadedAttachments];

  ticket.replies.push({
    senderType: "user",
    senderId: userId,
    message: trim(payload.message),
    attachments,
    createdAt: new Date(),
  });

  if (ticket.status === "resolved") {
    ticket.status = "in_progress";
  }

  await ticket.save();
  return ticket;
};

const getUserDashboardSummary = async (userId) => {
  const [
    totalApplications,
    activeApplications,
    completedApplications,
    openSupportTickets,
  ] = await Promise.all([
    VisaApplication.countDocuments({ userId }),
    VisaApplication.countDocuments({
      userId,
      status: { $in: ["submitted", "under_review", "documents_requested", "documents_received", "in_process", "on_hold"] },
    }),
    VisaApplication.countDocuments({ userId, status: { $in: ["approved", "completed"] } }),
    SupportTicket.countDocuments({ userId, status: { $in: ["open", "in_progress"] } }),
  ]);

  return {
    totalApplications,
    activeApplications,
    completedApplications,
    openSupportTickets,
  };
};

const listAdminCountries = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = String(query.isActive) === "true";
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { slug: { $regex: query.search, $options: "i" } },
      { code: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Country.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
    Country.countDocuments(filter),
  ]);

  const countryIds = items.map((item) => item._id);
  const visaTypeStats = await CountryVisaType.aggregate([
    { $match: { countryId: { $in: countryIds } } },
    {
      $group: {
        _id: "$countryId",
        totalVisaTypes: { $sum: 1 },
        activeVisaTypes: {
          $sum: {
            $cond: [{ $eq: ["$isActive", true] }, 1, 0],
          },
        },
        activeApplyVisaTypes: {
          $sum: {
            $cond: [
              {
                $and: [{ $eq: ["$isActive", true] }, { $eq: ["$applicationEnabled", true] }],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const visaTypeStatsMap = new Map(visaTypeStats.map((item) => [String(item._id), item]));

  return {
    items: items.map((item) => {
      const payload = buildCountryPayload(item);
      const stats = visaTypeStatsMap.get(String(item._id));

      return {
        ...payload,
        totalVisaTypes: stats?.totalVisaTypes || 0,
        activeVisaTypes: stats?.activeVisaTypes || 0,
        activeApplyVisaTypes: stats?.activeApplyVisaTypes || 0,
      };
    }),
    pagination: getPaginationMeta(page, limit, total),
  };
};

const getAdminCountryById = async (countryId) => {
  const country = await Country.findById(countryId).lean();
  if (!country) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  return buildCountryPayload(country);
};

const createAdminCountry = async (payload, actorId) => {
  const normalized = normalizeCountryPayload(payload, actorId);

  const existing = await Country.findOne({ slug: normalized.slug }).lean();
  if (existing) {
    throw new ApiError(409, "DUPLICATE_COUNTRY", "Country slug already exists");
  }

  const created = await Country.create(normalized);
  return buildCountryPayload(created);
};

const updateAdminCountry = async (countryId, payload, actorId) => {
  const normalized = normalizeCountryPayload(payload, actorId, { isUpdate: true });

  if (normalized.slug) {
    const existing = await Country.findOne({ slug: normalized.slug, _id: { $ne: countryId } }).lean();
    if (existing) {
      throw new ApiError(409, "DUPLICATE_COUNTRY", "Country slug already exists");
    }
  }

  const updated = await Country.findByIdAndUpdate(countryId, normalized, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  return buildCountryPayload(updated);
};

const updateAdminCountryStatus = async (countryId, payload, actorId) => {
  if (typeof payload.isActive !== "boolean") {
    throw new ApiError(422, "VALIDATION_ERROR", "isActive must be a boolean");
  }

  const updated = await Country.findByIdAndUpdate(
    countryId,
    {
      isActive: payload.isActive,
      updatedBy: actorId || null,
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  return buildCountryPayload(updated);
};

const deleteAdminCountry = async (countryId) => {
  const linked = await CountryVisaType.countDocuments({ countryId });
  if (linked > 0) {
    throw new ApiError(409, "COUNTRY_IN_USE", "Country cannot be deleted while visa types are mapped to it");
  }

  const deleted = await Country.findByIdAndDelete(countryId).lean();
  if (!deleted) {
    throw new ApiError(404, "COUNTRY_NOT_FOUND", "Country not found");
  }

  return { deleted: true, countryId };
};

const listAdminVisaCategories = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = String(query.isActive) === "true";
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { slug: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    VisaCategory.find(filter).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
    VisaCategory.countDocuments(filter),
  ]);

  return {
    items: items.map(buildVisaCategoryPayload),
    pagination: getPaginationMeta(page, limit, total),
  };
};

const getAdminVisaCategoryById = async (visaCategoryId) => {
  const item = await VisaCategory.findById(visaCategoryId).lean();
  if (!item) {
    throw new ApiError(404, "VISA_CATEGORY_NOT_FOUND", "Visa category not found");
  }

  return buildVisaCategoryPayload(item);
};

const createAdminVisaCategory = async (payload, actorId) => {
  const normalized = normalizeVisaCategoryPayload(payload, actorId);

  const existing = await VisaCategory.findOne({ slug: normalized.slug }).lean();
  if (existing) {
    throw new ApiError(409, "DUPLICATE_VISA_CATEGORY", "Visa category slug already exists");
  }

  const item = await VisaCategory.create(normalized);
  return buildVisaCategoryPayload(item);
};

const updateAdminVisaCategory = async (visaCategoryId, payload, actorId) => {
  const normalized = normalizeVisaCategoryPayload(payload, actorId, { isUpdate: true });

  if (normalized.slug) {
    const existing = await VisaCategory.findOne({ slug: normalized.slug, _id: { $ne: visaCategoryId } }).lean();
    if (existing) {
      throw new ApiError(409, "DUPLICATE_VISA_CATEGORY", "Visa category slug already exists");
    }
  }

  const item = await VisaCategory.findByIdAndUpdate(visaCategoryId, normalized, {
    new: true,
    runValidators: true,
  }).lean();

  if (!item) {
    throw new ApiError(404, "VISA_CATEGORY_NOT_FOUND", "Visa category not found");
  }

  return buildVisaCategoryPayload(item);
};

const updateAdminVisaCategoryStatus = async (visaCategoryId, payload, actorId) => {
  if (typeof payload.isActive !== "boolean") {
    throw new ApiError(422, "VALIDATION_ERROR", "isActive must be a boolean");
  }

  const item = await VisaCategory.findByIdAndUpdate(
    visaCategoryId,
    {
      isActive: payload.isActive,
      updatedBy: actorId || null,
    },
    { new: true, runValidators: true }
  ).lean();

  if (!item) {
    throw new ApiError(404, "VISA_CATEGORY_NOT_FOUND", "Visa category not found");
  }

  return buildVisaCategoryPayload(item);
};

const deleteAdminVisaCategory = async (visaCategoryId) => {
  const linked = await CountryVisaType.countDocuments({ visaCategoryId });
  if (linked > 0) {
    throw new ApiError(409, "VISA_CATEGORY_IN_USE", "Visa category cannot be deleted while linked to country visa types");
  }

  const item = await VisaCategory.findByIdAndDelete(visaCategoryId).lean();
  if (!item) {
    throw new ApiError(404, "VISA_CATEGORY_NOT_FOUND", "Visa category not found");
  }

  return { deleted: true, visaCategoryId };
};

const listAdminCountryVisaTypes = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.countryId) {
    filter.countryId = query.countryId;
  }

  if (query.countrySlug) {
    filter.countrySlug = slugify(query.countrySlug);
  }

  if (query.visaCategoryId) {
    filter.visaCategoryId = query.visaCategoryId;
  }

  if (query.visaTypeSlug) {
    filter.visaTypeSlug = slugify(query.visaTypeSlug);
  }

  if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = String(query.isActive) === "true";
  }

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { countryName: { $regex: query.search, $options: "i" } },
      { visaTypeName: { $regex: query.search, $options: "i" } },
      { countrySlug: { $regex: query.search, $options: "i" } },
      { visaTypeSlug: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    CountryVisaType.find(filter)
      .populate("countryId", "name slug")
      .populate("visaCategoryId", "name slug iconKey")
      .sort({ sortOrder: 1, updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    CountryVisaType.countDocuments(filter),
  ]);

  return {
    items: items.map((item) => buildCountryVisaTypePayload(item, { includeAdminFields: true })),
    pagination: getPaginationMeta(page, limit, total),
  };
};

const getAdminCountryVisaTypeById = async (countryVisaTypeId) => {
  const item = await CountryVisaType.findById(countryVisaTypeId)
    .populate("countryId", "name slug")
    .populate("visaCategoryId", "name slug iconKey");

  if (!item) {
    throw new ApiError(404, "COUNTRY_VISA_TYPE_NOT_FOUND", "Country visa type not found");
  }

  return buildCountryVisaTypePayload(item, { includeAdminFields: true });
};

const createAdminCountryVisaType = async (payload, actorId) => {
  const normalized = await normalizeCountryVisaTypePayload(payload, actorId);

  const existing = await CountryVisaType.findOne({
    countryId: normalized.countryId,
    visaCategoryId: normalized.visaCategoryId,
  }).lean();

  if (existing) {
    throw new ApiError(409, "DUPLICATE_COUNTRY_VISA_TYPE", "Country + visa category mapping already exists");
  }

  let created = null;
  try {
    created = await CountryVisaType.create(normalized);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "DUPLICATE_COUNTRY_VISA_TYPE", "Country + visa category mapping already exists");
    }
    throw error;
  }

  const populated = await CountryVisaType.findById(created._id)
    .populate("countryId", "name slug")
    .populate("visaCategoryId", "name slug iconKey");

  return buildCountryVisaTypePayload(populated, { includeAdminFields: true });
};

const updateAdminCountryVisaType = async (countryVisaTypeId, payload, actorId) => {
  const existing = await CountryVisaType.findById(countryVisaTypeId);
  if (!existing) {
    throw new ApiError(404, "COUNTRY_VISA_TYPE_NOT_FOUND", "Country visa type not found");
  }

  const normalized = await normalizeCountryVisaTypePayload(
    {
      ...existing.toObject(),
      ...payload,
      countryId: payload.countryId || existing.countryId,
      visaCategoryId: payload.visaCategoryId || existing.visaCategoryId,
    },
    actorId,
    { isUpdate: true }
  );

  const duplicate = await CountryVisaType.findOne({
    _id: { $ne: countryVisaTypeId },
    countryId: normalized.countryId,
    visaCategoryId: normalized.visaCategoryId,
  }).lean();

  if (duplicate) {
    throw new ApiError(409, "DUPLICATE_COUNTRY_VISA_TYPE", "Country + visa category mapping already exists");
  }

  let updated = null;
  try {
    updated = await CountryVisaType.findByIdAndUpdate(countryVisaTypeId, normalized, {
      new: true,
      runValidators: true,
    })
      .populate("countryId", "name slug")
      .populate("visaCategoryId", "name slug iconKey");
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "DUPLICATE_COUNTRY_VISA_TYPE", "Country + visa category mapping already exists");
    }
    throw error;
  }

  return buildCountryVisaTypePayload(updated, { includeAdminFields: true });
};

const updateAdminCountryVisaTypeStatus = async (countryVisaTypeId, payload, actorId) => {
  const updates = {
    updatedBy: actorId || null,
  };

  if (typeof payload.isActive === "boolean") {
    updates.isActive = payload.isActive;
  }

  if (typeof payload.applicationEnabled === "boolean") {
    updates.applicationEnabled = payload.applicationEnabled;
  }

  if (typeof payload.consultationEnabled === "boolean") {
    updates.consultationEnabled = payload.consultationEnabled;
  }

  const item = await CountryVisaType.findByIdAndUpdate(countryVisaTypeId, updates, {
    new: true,
    runValidators: true,
  })
    .populate("countryId", "name slug")
    .populate("visaCategoryId", "name slug iconKey");

  if (!item) {
    throw new ApiError(404, "COUNTRY_VISA_TYPE_NOT_FOUND", "Country visa type not found");
  }

  return buildCountryVisaTypePayload(item, { includeAdminFields: true });
};

const deleteAdminCountryVisaType = async (countryVisaTypeId) => {
  const linkedApps = await VisaApplication.countDocuments({ countryVisaTypeId });
  if (linkedApps > 0) {
    throw new ApiError(409, "COUNTRY_VISA_TYPE_IN_USE", "Cannot delete visa type while applications exist");
  }

  const item = await CountryVisaType.findByIdAndDelete(countryVisaTypeId).lean();
  if (!item) {
    throw new ApiError(404, "COUNTRY_VISA_TYPE_NOT_FOUND", "Country visa type not found");
  }

  return { deleted: true, countryVisaTypeId };
};

const listAdminApplications = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.countryId) {
    filter.countryId = query.countryId;
  }

  if (query.visaCategoryId) {
    filter.visaCategoryId = query.visaCategoryId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.dateFrom || query.dateTo) {
    filter.appliedAt = {};
    if (query.dateFrom) {
      filter.appliedAt.$gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      filter.appliedAt.$lte = new Date(query.dateTo);
    }
  }

  if (query.search) {
    filter.$or = [
      { applicationNumber: { $regex: query.search, $options: "i" } },
      { "applicantDetails.firstName": { $regex: query.search, $options: "i" } },
      { "applicantDetails.lastName": { $regex: query.search, $options: "i" } },
      { "applicantDetails.email": { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    VisaApplication.find(filter)
      .populate("userId", "firstName lastName email phone")
      .populate("countryId", "name slug")
      .populate("visaCategoryId", "name slug")
      .populate("countryVisaTypeId", "title")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit),
    VisaApplication.countDocuments(filter),
  ]);

  return {
    items,
    pagination: getPaginationMeta(page, limit, total),
  };
};

const getAdminApplicationById = async (applicationId) => {
  const item = await VisaApplication.findById(applicationId)
    .populate("userId", "firstName lastName email phone")
    .populate("countryId", "name slug")
    .populate("visaCategoryId", "name slug")
    .populate("countryVisaTypeId", "title requiredDocs")
    .lean();

  if (!item) {
    throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found");
  }

  return item;
};

const updateAdminApplicationStatus = async (applicationId, payload, actorId) => {
  if (!VISA_APPLICATION_STATUSES.includes(payload.status)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid application status");
  }

  const item = await VisaApplication.findById(applicationId);
  if (!item) {
    throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found");
  }

  item.status = payload.status;
  item.statusHistory.push({
    status: payload.status,
    note: trim(payload.note),
    updatedBy: actorId || null,
    updatedAt: new Date(),
  });

  if (hasOwn(payload, "adminNotes")) {
    item.adminNotes = trim(payload.adminNotes);
  }

  await item.save();
  return item;
};

const updateAdminApplicationNotes = async (applicationId, payload) => {
  const item = await VisaApplication.findByIdAndUpdate(
    applicationId,
    { adminNotes: trim(payload.adminNotes) },
    { new: true, runValidators: true }
  );

  if (!item) {
    throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found");
  }

  return item;
};

const archiveAdminApplication = async (applicationId) => {
  const item = await VisaApplication.findByIdAndUpdate(
    applicationId,
    { isArchived: true },
    { new: true, runValidators: true }
  ).lean();

  if (!item) {
    throw new ApiError(404, "APPLICATION_NOT_FOUND", "Application not found");
  }

  return { archived: true, applicationId: item._id };
};

const listAdminEnquiries = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.enquiryType) {
    filter.enquiryType = query.enquiryType;
  }

  if (query.search) {
    filter.$or = [
      { enquiryNumber: { $regex: query.search, $options: "i" } },
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
      { phone: { $regex: query.search, $options: "i" } },
      { countryOfInterest: { $regex: query.search, $options: "i" } },
      { visaInterestType: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Enquiry.find(filter)
      .populate("userId", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Enquiry.countDocuments(filter),
  ]);

  return {
    items,
    pagination: getPaginationMeta(page, limit, total),
  };
};

const getAdminEnquiryById = async (enquiryId) => {
  const item = await Enquiry.findById(enquiryId)
    .populate("userId", "firstName lastName email")
    .populate("assignedTo", "firstName lastName email")
    .lean();

  if (!item) {
    throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Enquiry not found");
  }

  return item;
};

const updateAdminEnquiryStatus = async (enquiryId, payload) => {
  if (!ENQUIRY_STATUSES.includes(payload.status)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid enquiry status");
  }

  const item = await Enquiry.findByIdAndUpdate(
    enquiryId,
    {
      status: payload.status,
      assignedTo: payload.assignedTo || undefined,
    },
    { new: true, runValidators: true }
  );

  if (!item) {
    throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Enquiry not found");
  }

  return item;
};

const updateAdminEnquiryNotes = async (enquiryId, payload) => {
  const item = await Enquiry.findByIdAndUpdate(
    enquiryId,
    { adminNotes: trim(payload.adminNotes) },
    { new: true, runValidators: true }
  );

  if (!item) {
    throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Enquiry not found");
  }

  return item;
};

const deleteAdminEnquiry = async (enquiryId) => {
  const item = await Enquiry.findByIdAndDelete(enquiryId).lean();
  if (!item) {
    throw new ApiError(404, "ENQUIRY_NOT_FOUND", "Enquiry not found");
  }

  return { deleted: true, enquiryId };
};

const listAdminTickets = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.search) {
    filter.$or = [
      { ticketNumber: { $regex: query.search, $options: "i" } },
      { subject: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate("userId", "firstName lastName email")
      .populate("applicationId", "applicationNumber status")
      .populate("assignedTo", "firstName lastName email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(filter),
  ]);

  return {
    items,
    pagination: getPaginationMeta(page, limit, total),
  };
};

const getAdminTicketById = async (ticketId) => {
  const item = await SupportTicket.findById(ticketId)
    .populate("userId", "firstName lastName email phone")
    .populate("applicationId", "applicationNumber status countrySlug visaTypeSlug")
    .populate("assignedTo", "firstName lastName email")
    .populate("replies.senderId", "firstName lastName email role")
    .lean();

  if (!item) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  return item;
};

const updateAdminTicketStatus = async (ticketId, payload) => {
  if (!TICKET_STATUSES.includes(payload.status)) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid ticket status");
  }

  const updates = {
    status: payload.status,
  };

  if (payload.priority) {
    if (!TICKET_PRIORITIES.includes(payload.priority)) {
      throw new ApiError(422, "VALIDATION_ERROR", "Invalid ticket priority");
    }
    updates.priority = payload.priority;
  }

  if (hasOwn(payload, "assignedTo")) {
    updates.assignedTo = payload.assignedTo || null;
  }

  const item = await SupportTicket.findByIdAndUpdate(ticketId, updates, {
    new: true,
    runValidators: true,
  });

  if (!item) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  return item;
};

const replyToAdminTicket = async (ticketId, payload, actorId, files = []) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  const urlAttachments = buildUrlAttachments(parseAttachmentUrls(payload.attachmentUrls));
  const uploadedAttachments = await uploadTicketFiles(files, actorId || "admin");
  const attachments = [...urlAttachments, ...uploadedAttachments];

  ticket.replies.push({
    senderType: "admin",
    senderId: actorId,
    message: trim(payload.message),
    attachments,
    createdAt: new Date(),
  });

  if (ticket.status === "open") {
    ticket.status = "in_progress";
  }

  await ticket.save();
  return ticket;
};

const listAdminUsers = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.isDeleted !== undefined && query.isDeleted !== "") {
    filter.isDeleted = String(query.isDeleted) === "true";
  } else {
    filter.isDeleted = { $ne: true };
  }

  if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = String(query.isActive) === "true";
  }

  if (query.role) {
    filter.role = trim(query.role);
  }

  if (query.search) {
    filter.$or = [
      { firstName: { $regex: query.search, $options: "i" } },
      { lastName: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
      { phone: { $regex: query.search, $options: "i" } },
    ];
  }

  const allowedSortBy = new Set(["createdAt", "updatedAt", "firstName", "lastName", "email", "role"]);
  const sortBy = allowedSortBy.has(trim(query.sortBy)) ? trim(query.sortBy) : "createdAt";
  const sortOrder = String(query.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("firstName lastName fullName email phone role avatarUrl isActive isDeleted createdAt updatedAt")
      .sort({ [sortBy]: sortOrder, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const userIds = items.map((item) => item._id);

  const [applicationCounts, ticketCounts, enquiryCounts] = await Promise.all([
    VisaApplication.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", total: { $sum: 1 } } },
    ]),
    SupportTicket.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", total: { $sum: 1 } } },
    ]),
    Enquiry.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", total: { $sum: 1 } } },
    ]),
  ]);

  const applicationMap = new Map(applicationCounts.map((item) => [String(item._id), item.total]));
  const ticketMap = new Map(ticketCounts.map((item) => [String(item._id), item.total]));
  const enquiryMap = new Map(enquiryCounts.map((item) => [String(item._id), item.total]));

  return {
    items: items.map((item) => ({
      ...item,
      totalApplications: applicationMap.get(String(item._id)) || 0,
      totalTickets: ticketMap.get(String(item._id)) || 0,
      totalEnquiries: enquiryMap.get(String(item._id)) || 0,
    })),
    pagination: getPaginationMeta(page, limit, total),
  };
};

const getAdminUserById = async (userId) => {
  const user = await User.findById(userId)
    .select("firstName lastName fullName email phone role country profile isActive isDeleted createdAt updatedAt")
    .lean();

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  const [applications, tickets, enquiries] = await Promise.all([
    VisaApplication.find({ userId })
      .select("applicationNumber status countrySlug visaTypeSlug appliedAt")
      .sort({ appliedAt: -1 })
      .limit(50)
      .lean(),
    SupportTicket.find({ userId })
      .select("ticketNumber status priority category updatedAt")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean(),
    Enquiry.find({ userId })
      .select("enquiryNumber status enquiryType pageSource createdAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  return {
    ...user,
    applications,
    tickets,
    enquiries,
  };
};

const updateAdminUserStatus = async (userId, payload) => {
  const existing = await User.findById(userId).select("isActive isDeleted deletedAt role").lean();
  if (!existing) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  const updates = {};

  if (hasOwn(payload, "isDeleted")) {
    const shouldDelete = Boolean(payload.isDeleted);
    if (!shouldDelete && existing.isDeleted) {
      throw new ApiError(422, "INVALID_USER_STATE", "Deleted users cannot be restored from status update");
    }

    if (shouldDelete) {
      updates.isDeleted = true;
      updates.deletedAt = existing.deletedAt || new Date();
      updates.isActive = false;
    }
  }

  const deletedAfterUpdate = updates.isDeleted === true || (existing.isDeleted && !hasOwn(payload, "isDeleted"));

  if (hasOwn(payload, "isActive")) {
    if (deletedAfterUpdate && Boolean(payload.isActive)) {
      throw new ApiError(422, "INVALID_USER_STATE", "Deleted users cannot be activated");
    }

    updates.isActive = deletedAfterUpdate ? false : Boolean(payload.isActive);
  }

  if (hasOwn(payload, "role")) {
    if (deletedAfterUpdate) {
      throw new ApiError(422, "INVALID_USER_STATE", "Deleted users cannot be modified");
    }
    updates.role = trim(payload.role);
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(422, "VALIDATION_ERROR", "At least one updatable field is required");
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  })
    .select("firstName lastName fullName email phone role isActive isDeleted createdAt updatedAt")
    .lean();

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return user;
};

const deleteAdminUser = async (userId, options = {}) => {
  const hardDelete = Boolean(options.hardDelete);

  if (hardDelete) {
    const user = await User.findByIdAndDelete(userId).lean();
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    return { deleted: true, hardDelete: true, userId };
  }

  const existing = await User.findById(userId).lean();
  if (!existing) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (existing.isDeleted) {
    return { deleted: true, hardDelete: false, userId, alreadyDeleted: true };
  }

  await User.findByIdAndUpdate(
    userId,
    {
      isDeleted: true,
      isActive: false,
      deletedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).lean();

  return { deleted: true, hardDelete: false, userId };
};

const getAdminDashboardSummary = async () => {
  const [
    totalCountries,
    totalVisaCategories,
    totalCountryVisaTypes,
    totalApplications,
    activeApplications,
    totalEnquiries,
    newEnquiries,
    totalTickets,
    openTickets,
    totalUsers,
    activeUsers,
  ] = await Promise.all([
    Country.countDocuments({}),
    VisaCategory.countDocuments({}),
    CountryVisaType.countDocuments({}),
    VisaApplication.countDocuments({}),
    VisaApplication.countDocuments({ status: { $in: ["submitted", "under_review", "in_process", "documents_requested"] } }),
    Enquiry.countDocuments({}),
    Enquiry.countDocuments({ status: "new" }),
    SupportTicket.countDocuments({}),
    SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    User.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments({ isActive: true, isDeleted: { $ne: true } }),
  ]);

  return {
    totalCountries,
    totalVisaCategories,
    totalCountryVisaTypes,
    totalApplications,
    activeApplications,
    totalEnquiries,
    newEnquiries,
    totalTickets,
    openTickets,
    totalUsers,
    activeUsers,
  };
};

module.exports = {
  ALLOWED_ICON_KEYS,
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  VISA_APPLICATION_STATUSES,
  getPublicSiteSettings,
  listPublicCountries,
  getPublicCountryBySlug,
  listPublicVisaTypesByCountry,
  getPublicVisaTypeContent,
  getPublicApplicationConfig,
  searchPublicVisaTypes,
  createVisaApplication,
  uploadAdminSiteAsset,
  uploadUserAvatar,
  createPublicEnquiry,
  listUserApplications,
  getUserApplicationById,
  createUserApplication,
  listUserTickets,
  createUserTicket,
  getUserTicketById,
  replyToUserTicket,
  getUserDashboardSummary,
  listAdminCountries,
  getAdminCountryById,
  createAdminCountry,
  updateAdminCountry,
  updateAdminCountryStatus,
  deleteAdminCountry,
  listAdminVisaCategories,
  getAdminVisaCategoryById,
  createAdminVisaCategory,
  updateAdminVisaCategory,
  updateAdminVisaCategoryStatus,
  deleteAdminVisaCategory,
  listAdminCountryVisaTypes,
  getAdminCountryVisaTypeById,
  createAdminCountryVisaType,
  updateAdminCountryVisaType,
  updateAdminCountryVisaTypeStatus,
  deleteAdminCountryVisaType,
  listAdminApplications,
  getAdminApplicationById,
  updateAdminApplicationStatus,
  updateAdminApplicationNotes,
  archiveAdminApplication,
  listAdminEnquiries,
  getAdminEnquiryById,
  updateAdminEnquiryStatus,
  updateAdminEnquiryNotes,
  deleteAdminEnquiry,
  listAdminTickets,
  getAdminTicketById,
  updateAdminTicketStatus,
  replyToAdminTicket,
  listAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
  deleteAdminUser,
  getAdminDashboardSummary,
};
