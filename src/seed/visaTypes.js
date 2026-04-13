require("dotenv").config();

const connectDB = require("../config/db.js");
const Country = require("../models/Country.js");
const VisaCategory = require("../models/VisaCategory.js");
const CountryVisaType = require("../models/CountryVisaType.js");
const { visaTypesSeed } = require("./visaTypes.data.js");
const { countriesSeed } = require("./countries.js");

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleCase = (value) =>
  String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const DEFAULT_VISA_CATEGORIES = [
  { name: "Tourist Visa", slug: "tourist", description: "Tourism and short leisure travel" },
  { name: "Visitor Visa", slug: "visitor", description: "Family visit and short travel" },
  { name: "Student Visa", slug: "student", description: "Study and education visas" },
  { name: "Business Visa", slug: "business", description: "Business travel visas" },
  { name: "Dependent Visa", slug: "dependent", description: "Dependent and family visas" },
  { name: "Work Visa", slug: "work", description: "Employment and skilled visas" },
  { name: "Migration Visa", slug: "migration", description: "Permanent migration pathways" },
];

const inferCategorySlug = (item) => {
  const slug = slugify(item.visaTypeSlug || item.visaTypeName);

  if (["f1", "student"].some((needle) => slug.includes(needle))) {
    return "student";
  }
  if (["f2", "dependent"].some((needle) => slug.includes(needle))) {
    return "dependent";
  }
  if (["business", "b1", "b2"].some((needle) => slug.includes(needle))) {
    return "business";
  }
  if (["visitor", "standard-visitor"].some((needle) => slug.includes(needle))) {
    return "visitor";
  }
  if (slug.includes("tourist")) {
    return "tourist";
  }
  if (slug.includes("work")) {
    return "work";
  }
  if (["migration", "permanent", "pr"].some((needle) => slug.includes(needle))) {
    return "migration";
  }

  return slug || "visitor";
};

const normalizeRequiredDocs = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          name: item.trim(),
          description: "",
          isMandatory: true,
          allowedFileTypes: [],
          maxFiles: 1,
          sortOrder: index,
        };
      }

      return {
        name: String(item.name || "").trim(),
        description: String(item.description || "").trim(),
        isMandatory: item.isMandatory !== false,
        allowedFileTypes: Array.isArray(item.allowedFileTypes) ? item.allowedFileTypes : [],
        maxFiles: Math.max(1, Number(item.maxFiles) || 1),
        sortOrder: Number(item.sortOrder) || index,
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
          title: item.trim(),
          description: "",
          sortOrder: index,
        };
      }

      return {
        title: String(item.title || item.label || "").trim(),
        description: String(item.description || "").trim(),
        sortOrder: Number(item.sortOrder) || index,
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
          label: item.trim(),
          description: "",
          sortOrder: index,
        };
      }

      return {
        label: String(item.label || item.title || "").trim(),
        description: String(item.description || "").trim(),
        sortOrder: Number(item.sortOrder) || index,
      };
    })
    .filter((item) => item.label || item.description);
};

const normalizeFaqs = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item, index) => ({
      question: String(item?.question || "").trim(),
      answer: String(item?.answer || "").trim(),
      sortOrder: Number(item?.sortOrder) || index,
    }))
    .filter((item) => item.question && item.answer);
};

const runSeedVisaTypes = async () => {
  await connectDB();

  const uniqueCountryInputs = new Map();

  for (const countryItem of countriesSeed) {
    uniqueCountryInputs.set(slugify(countryItem.slug || countryItem.name), {
      name: countryItem.name,
      slug: slugify(countryItem.slug || countryItem.name),
      code: String(countryItem.code || "").toUpperCase(),
      description: countryItem.description || "",
      sortOrder: Number(countryItem.ranking) || 0,
      isActive: true,
    });
  }

  for (const seedItem of visaTypesSeed) {
    const slug = slugify(seedItem.countrySlug || seedItem.countryName);
    if (!uniqueCountryInputs.has(slug)) {
      uniqueCountryInputs.set(slug, {
        name: seedItem.countryName || titleCase(slug.replace(/-/g, " ")),
        slug,
        code: "",
        description: "",
        sortOrder: 0,
        isActive: true,
      });
    }
  }

  const countryMap = new Map();
  for (const [, countryInput] of uniqueCountryInputs) {
    // eslint-disable-next-line no-await-in-loop
    const country = await Country.findOneAndUpdate(
      { slug: countryInput.slug },
      {
        $set: {
          name: countryInput.name,
          slug: countryInput.slug,
          code: countryInput.code,
          description: countryInput.description,
          sortOrder: countryInput.sortOrder,
          ranking: countryInput.sortOrder,
          isActive: countryInput.isActive,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    countryMap.set(countryInput.slug, country);
  }

  const categoryMap = new Map();
  for (const categorySeed of DEFAULT_VISA_CATEGORIES) {
    // eslint-disable-next-line no-await-in-loop
    const category = await VisaCategory.findOneAndUpdate(
      { slug: categorySeed.slug },
      {
        $set: {
          name: categorySeed.name,
          slug: categorySeed.slug,
          description: categorySeed.description,
          isActive: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    categoryMap.set(category.slug, category);
  }

  for (const seedItem of visaTypesSeed) {
    const inferredSlug = inferCategorySlug(seedItem);
    if (!categoryMap.has(inferredSlug)) {
      // eslint-disable-next-line no-await-in-loop
      const dynamicCategory = await VisaCategory.findOneAndUpdate(
        { slug: inferredSlug },
        {
          $set: {
            name: `${titleCase((seedItem.visaTypeName || inferredSlug).replace(/-/g, " "))} Visa`,
            slug: inferredSlug,
            description: "Auto-generated from existing visa content",
            isActive: true,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      categoryMap.set(inferredSlug, dynamicCategory);
    }
  }

  let upserted = 0;

  for (const seedItem of visaTypesSeed) {
    const countrySlug = slugify(seedItem.countrySlug || seedItem.countryName);
    const country = countryMap.get(countrySlug);
    const visaCategory = categoryMap.get(inferCategorySlug(seedItem));

    if (!country || !visaCategory) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const visaTypeSlug = slugify(seedItem.visaTypeSlug || seedItem.visaTypeName);

    // eslint-disable-next-line no-await-in-loop
    await CountryVisaType.findOneAndUpdate(
      { countryId: country._id, visaCategoryId: visaCategory._id },
      {
        $set: {
          countryId: country._id,
          visaCategoryId: visaCategory._id,
          countrySlug: country.slug,
          countryName: country.name,
          visaTypeSlug,
          visaTypeName: seedItem.visaTypeName || visaCategory.name,
          title: seedItem.title || `${country.name} ${seedItem.visaTypeName || visaCategory.name}`,
          badge: seedItem.badge || "",
          subtitle: seedItem.subtitle || "",
          heroImage: seedItem.heroImage || "",
          iconKey: seedItem.iconKey || visaCategory.iconKey || "",
          overview: seedItem.overview || "",
          serviceHighlights: Array.isArray(seedItem.serviceHighlights) ? seedItem.serviceHighlights : [],
          eligibility: Array.isArray(seedItem.eligibility) ? seedItem.eligibility : [],
          requiredDocs: normalizeRequiredDocs(seedItem.requiredDocs),
          process: normalizeProcess(seedItem.process),
          timeline: normalizeTimeline(seedItem.timeline),
          faqs: normalizeFaqs(seedItem.faqs),
          ctaTitle: seedItem.ctaTitle || "",
          ctaText: seedItem.ctaText || "",
          seoTitle: seedItem.seoTitle || "",
          seoDescription: seedItem.seoDescription || "",
          metaKeywords: Array.isArray(seedItem.metaKeywords) ? seedItem.metaKeywords : [],
          isActive: seedItem.isActive !== false,
          isFeatured: Boolean(seedItem.isFeatured),
          sortOrder: Number(seedItem.sortOrder) || 0,
          applicationEnabled: true,
          consultationEnabled: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    upserted += 1;
  }

  console.log(`Seed completed: ${countryMap.size} countries, ${categoryMap.size} visa categories, ${upserted} country visa types upserted.`);
  process.exit(0);
};

runSeedVisaTypes().catch((error) => {
  console.error("Visa type seed failed", error);
  process.exit(1);
});
