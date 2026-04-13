const VisaType = require("../models/VisaType.js");
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
]);

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const trimString = (value) => String(value || "").trim();

const isValidHeroImage = (value) => {
  if (!value) {
    return true;
  }

  return /^(https?:\/\/|\/)/i.test(value);
};

const normalizeStringArray = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => trimString(item))
    .filter(Boolean);
};

const ensureValidIconKey = (iconKey, fieldName) => {
  if (!iconKey) {
    return "";
  }

  const normalized = trimString(iconKey).toLowerCase();
  if (!ALLOWED_ICON_KEYS.has(normalized)) {
    throw new ApiError(422, "INVALID_ICON_KEY", `${fieldName} contains an unsupported icon key`);
  }

  return normalized;
};

const normalizeFaqs = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce((acc, item) => {
    const question = trimString(item?.question);
    const answer = trimString(item?.answer);

    if (!question && !answer) {
      return acc;
    }

    if (!question || !answer) {
      throw new ApiError(422, "INVALID_FAQ", "Each FAQ item must contain both question and answer");
    }

    acc.push({ question, answer });
    return acc;
  }, []);
};

const normalizeServiceHighlights = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce((acc, item) => {
    const title = trimString(item?.title);
    const description = trimString(item?.description);

    if (!title && !description) {
      return acc;
    }

    if (!title || !description) {
      throw new ApiError(
        422,
        "INVALID_SERVICE_HIGHLIGHT",
        "Each service highlight item must contain both title and description"
      );
    }

    acc.push({
      title,
      description,
      iconKey: ensureValidIconKey(item?.iconKey, "serviceHighlights.iconKey"),
    });

    return acc;
  }, []);
};

const normalizeSort = (sort, fallback = { updatedAt: -1 }) => {
  const allowedFields = new Set(["updatedAt", "sortOrder", "countrySlug", "visaTypeSlug", "title"]);

  if (!sort) {
    return fallback;
  }

  if (sort.includes(":")) {
    const [field, order] = sort.split(":");
    const normalizedField = trimString(field);
    if (!allowedFields.has(normalizedField)) {
      return fallback;
    }

    return { [normalizedField]: String(order).toLowerCase() === "asc" ? 1 : -1 };
  }

  if (sort.startsWith("-")) {
    const field = sort.slice(1);
    if (!allowedFields.has(field)) {
      return fallback;
    }
    return { [field]: -1 };
  }

  if (!allowedFields.has(sort)) {
    return fallback;
  }

  return { [sort]: 1 };
};

const buildPublicVisaPayload = (doc) => {
  const source = doc?.toObject ? doc.toObject() : doc;
  return {
    countrySlug: source.countrySlug,
    countryName: source.countryName,
    visaTypeSlug: source.visaTypeSlug,
    visaTypeName: source.visaTypeName,
    title: source.title,
    badge: source.badge || "",
    subtitle: source.subtitle || "",
    heroImage: source.heroImage || "",
    iconKey: source.iconKey || "",
    serviceHighlights: Array.isArray(source.serviceHighlights) ? source.serviceHighlights : [],
    eligibility: Array.isArray(source.eligibility) ? source.eligibility : [],
    requiredDocs: Array.isArray(source.requiredDocs) ? source.requiredDocs : [],
    process: Array.isArray(source.process) ? source.process : [],
    timeline: Array.isArray(source.timeline) ? source.timeline : [],
    faqs: Array.isArray(source.faqs) ? source.faqs : [],
    ctaTitle: source.ctaTitle || "",
    ctaText: source.ctaText || "",
    seoTitle: source.seoTitle || "",
    seoDescription: source.seoDescription || "",
  };
};

const hasOwn = (payload, key) => Object.prototype.hasOwnProperty.call(payload || {}, key);

const sanitizeVisaTypePayload = (payload, options = {}) => {
  const { isUpdate = false } = options;

  const updates = {};

  const requiredKeys = ["countryName", "countrySlug", "visaTypeName", "visaTypeSlug", "title"];
  if (!isUpdate) {
    for (const key of requiredKeys) {
      if (!trimString(payload[key])) {
        throw new ApiError(422, "VALIDATION_ERROR", `${key} is required`);
      }
    }
  }

  if (hasOwn(payload, "countryName")) {
    updates.countryName = trimString(payload.countryName);
  }

  if (hasOwn(payload, "countrySlug")) {
    updates.countrySlug = slugify(payload.countrySlug);
    if (!updates.countrySlug) {
      throw new ApiError(422, "VALIDATION_ERROR", "countrySlug is invalid");
    }
  }

  if (hasOwn(payload, "visaTypeName")) {
    updates.visaTypeName = trimString(payload.visaTypeName);
  }

  if (hasOwn(payload, "visaTypeSlug")) {
    updates.visaTypeSlug = slugify(payload.visaTypeSlug);
    if (!updates.visaTypeSlug) {
      throw new ApiError(422, "VALIDATION_ERROR", "visaTypeSlug is invalid");
    }
  }

  if (hasOwn(payload, "title")) {
    updates.title = trimString(payload.title);
  }

  if (hasOwn(payload, "badge")) {
    updates.badge = trimString(payload.badge);
  }

  if (hasOwn(payload, "subtitle")) {
    updates.subtitle = trimString(payload.subtitle);
  }

  if (hasOwn(payload, "heroImage")) {
    const heroImage = trimString(payload.heroImage);
    if (!isValidHeroImage(heroImage)) {
      throw new ApiError(422, "INVALID_HERO_IMAGE", "heroImage must be a valid URL or path");
    }
    updates.heroImage = heroImage;
  }

  if (hasOwn(payload, "iconKey")) {
    updates.iconKey = ensureValidIconKey(payload.iconKey, "iconKey");
  }

  if (hasOwn(payload, "serviceHighlights")) {
    updates.serviceHighlights = normalizeServiceHighlights(payload.serviceHighlights);
  } else if (!isUpdate) {
    updates.serviceHighlights = [];
  }

  if (hasOwn(payload, "eligibility")) {
    updates.eligibility = normalizeStringArray(payload.eligibility);
  } else if (!isUpdate) {
    updates.eligibility = [];
  }

  if (hasOwn(payload, "requiredDocs")) {
    updates.requiredDocs = normalizeStringArray(payload.requiredDocs);
  } else if (!isUpdate) {
    updates.requiredDocs = [];
  }

  if (hasOwn(payload, "process")) {
    updates.process = normalizeStringArray(payload.process);
  } else if (!isUpdate) {
    updates.process = [];
  }

  if (hasOwn(payload, "timeline")) {
    updates.timeline = normalizeStringArray(payload.timeline);
  } else if (!isUpdate) {
    updates.timeline = [];
  }

  if (hasOwn(payload, "faqs")) {
    updates.faqs = normalizeFaqs(payload.faqs);
  } else if (!isUpdate) {
    updates.faqs = [];
  }

  if (hasOwn(payload, "ctaTitle")) {
    updates.ctaTitle = trimString(payload.ctaTitle);
  }

  if (hasOwn(payload, "ctaText")) {
    updates.ctaText = trimString(payload.ctaText);
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

  if (hasOwn(payload, "seoTitle")) {
    updates.seoTitle = trimString(payload.seoTitle);
  }

  if (hasOwn(payload, "seoDescription")) {
    updates.seoDescription = trimString(payload.seoDescription);
  }

  if (hasOwn(payload, "metaKeywords")) {
    updates.metaKeywords = normalizeStringArray(payload.metaKeywords).map((item) => item.toLowerCase());
  } else if (!isUpdate) {
    updates.metaKeywords = [];
  }

  return updates;
};

const ensureUniqueCombination = async ({ countrySlug, visaTypeSlug, excludeId = null }) => {
  if (!countrySlug || !visaTypeSlug) {
    return;
  }

  const filter = { countrySlug, visaTypeSlug };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const existing = await VisaType.findOne(filter).select("_id").lean();
  if (existing) {
    throw new ApiError(409, "DUPLICATE_VISA_TYPE", "A visa type with this country and slug already exists");
  }
};

const createAdminVisaType = async (payload, actorId) => {
  const normalized = sanitizeVisaTypePayload(payload, { isUpdate: false });
  await ensureUniqueCombination({ countrySlug: normalized.countrySlug, visaTypeSlug: normalized.visaTypeSlug });

  try {
    return await VisaType.create({
      ...normalized,
      createdBy: actorId || null,
      updatedBy: actorId || null,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "DUPLICATE_VISA_TYPE", "A visa type with this country and slug already exists");
    }
    throw error;
  }
};

const listAdminVisaTypes = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.countrySlug) {
    filter.countrySlug = slugify(query.countrySlug);
  }

  if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = String(query.isActive) === "true";
  }

  if (query.search) {
    filter.$or = [
      { countryName: { $regex: query.search, $options: "i" } },
      { visaTypeName: { $regex: query.search, $options: "i" } },
      { title: { $regex: query.search, $options: "i" } },
      { countrySlug: { $regex: query.search, $options: "i" } },
      { visaTypeSlug: { $regex: query.search, $options: "i" } },
    ];
  }

  const sort = normalizeSort(query.sort, { updatedAt: -1 });

  const [items, total] = await Promise.all([
    VisaType.find(filter).sort(sort).skip(skip).limit(limit),
    VisaType.countDocuments(filter),
  ]);

  return {
    items,
    pagination: getPaginationMeta(page, limit, total),
  };
};

const getAdminVisaTypeById = async (id) => {
  const visaType = await VisaType.findById(id);
  if (!visaType) {
    throw new ApiError(404, "VISA_TYPE_NOT_FOUND", "Visa type not found");
  }

  return visaType;
};

const updateAdminVisaType = async (id, payload, actorId) => {
  const existing = await VisaType.findById(id);
  if (!existing) {
    throw new ApiError(404, "VISA_TYPE_NOT_FOUND", "Visa type not found");
  }

  const updates = sanitizeVisaTypePayload(payload, { isUpdate: true });

  const countrySlug = updates.countrySlug || existing.countrySlug;
  const visaTypeSlug = updates.visaTypeSlug || existing.visaTypeSlug;
  await ensureUniqueCombination({ countrySlug, visaTypeSlug, excludeId: id });

  try {
    const updated = await VisaType.findByIdAndUpdate(
      id,
      {
        ...updates,
        updatedBy: actorId || null,
      },
      { new: true, runValidators: true }
    );

    return updated;
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "DUPLICATE_VISA_TYPE", "A visa type with this country and slug already exists");
    }
    throw error;
  }
};

const toggleAdminVisaTypeStatus = async (id, payload, actorId) => {
  const visaType = await VisaType.findById(id);
  if (!visaType) {
    throw new ApiError(404, "VISA_TYPE_NOT_FOUND", "Visa type not found");
  }

  const nextStatus = typeof payload?.isActive === "boolean" ? payload.isActive : !visaType.isActive;

  visaType.isActive = nextStatus;
  visaType.updatedBy = actorId || null;
  await visaType.save();

  return visaType;
};

const deleteAdminVisaType = async (id) => {
  const visaType = await VisaType.findByIdAndDelete(id);
  if (!visaType) {
    throw new ApiError(404, "VISA_TYPE_NOT_FOUND", "Visa type not found");
  }

  return { deleted: true, id };
};

const listPublicVisaTypes = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.countrySlug) {
    filter.countrySlug = slugify(query.countrySlug);
  }

  if (query.isActive === undefined || query.isActive === "" || query.isActive === "true") {
    filter.isActive = true;
  } else if (query.isActive === "false") {
    filter.isActive = false;
  }

  if (query.search) {
    filter.$or = [
      { countryName: { $regex: query.search, $options: "i" } },
      { visaTypeName: { $regex: query.search, $options: "i" } },
      { title: { $regex: query.search, $options: "i" } },
      { countrySlug: { $regex: query.search, $options: "i" } },
      { visaTypeSlug: { $regex: query.search, $options: "i" } },
    ];
  }

  const sort = normalizeSort(query.sort, { sortOrder: 1, updatedAt: -1 });

  const [items, total] = await Promise.all([
    VisaType.find(filter).sort(sort).skip(skip).limit(limit),
    VisaType.countDocuments(filter),
  ]);

  return {
    items: items.map(buildPublicVisaPayload),
    pagination: getPaginationMeta(page, limit, total),
  };
};

const getPublicVisaTypeBySlugs = async (countrySlug, visaTypeSlug) => {
  const normalizedCountrySlug = slugify(countrySlug);
  const normalizedVisaTypeSlug = slugify(visaTypeSlug);

  const visaType = await VisaType.findOne({
    countrySlug: normalizedCountrySlug,
    visaTypeSlug: normalizedVisaTypeSlug,
    isActive: true,
  });

  if (!visaType) {
    throw new ApiError(404, "VISA_TYPE_NOT_FOUND", "Visa type not found");
  }

  return buildPublicVisaPayload(visaType);
};

const getVisaCountriesWithTypes = async () => {
  const items = await VisaType.find({ isActive: true })
    .select("countrySlug countryName visaTypeSlug visaTypeName title sortOrder")
    .sort({ countryName: 1, sortOrder: 1, visaTypeName: 1 })
    .lean();

  const groupedMap = new Map();

  for (const item of items) {
    const key = item.countrySlug;
    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        countrySlug: item.countrySlug,
        countryName: item.countryName,
        visaTypes: [],
      });
    }

    groupedMap.get(key).visaTypes.push({
      visaTypeSlug: item.visaTypeSlug,
      visaTypeName: item.visaTypeName,
      title: item.title,
      sortOrder: item.sortOrder,
    });
  }

  return Array.from(groupedMap.values());
};

module.exports = {
  ALLOWED_ICON_KEYS: Array.from(ALLOWED_ICON_KEYS),
  createAdminVisaType,
  listAdminVisaTypes,
  getAdminVisaTypeById,
  updateAdminVisaType,
  toggleAdminVisaTypeStatus,
  deleteAdminVisaType,
  listPublicVisaTypes,
  getPublicVisaTypeBySlugs,
  getVisaCountriesWithTypes,
};
