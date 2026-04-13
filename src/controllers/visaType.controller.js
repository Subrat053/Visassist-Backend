const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const visaPortalService = require("../services/visaPortal.service.js");

const createAdminVisaType = asyncHandler(async (req, res) => {
  const data = await visaPortalService.createAdminCountryVisaType(req.body, req.user?._id || null);
  return sendSuccess(res, 201, data);
});

const listAdminVisaTypes = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listAdminCountryVisaTypes(req.query);
  return sendSuccess(res, 200, data);
});

const getAdminVisaTypeById = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getAdminCountryVisaTypeById(req.params.id);
  return sendSuccess(res, 200, data);
});

const updateAdminVisaType = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminCountryVisaType(req.params.id, req.body, req.user?._id || null);
  return sendSuccess(res, 200, data);
});

const toggleAdminVisaTypeStatus = asyncHandler(async (req, res) => {
  const data = await visaPortalService.updateAdminCountryVisaTypeStatus(req.params.id, req.body, req.user?._id || null);
  return sendSuccess(res, 200, data);
});

const deleteAdminVisaType = asyncHandler(async (req, res) => {
  const data = await visaPortalService.deleteAdminCountryVisaType(req.params.id);
  return sendSuccess(res, 200, data);
});

const listPublicVisaTypes = asyncHandler(async (req, res) => {
  let data;
  if (req.query.countrySlug) {
    const items = await visaPortalService.listPublicVisaTypesByCountry(req.query.countrySlug);
    data = { items };
  } else {
    const items = await visaPortalService.searchPublicVisaTypes(req.query);
    data = { items };
  }
  return sendSuccess(res, 200, data);
});

const getPublicVisaTypeBySlugs = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getPublicVisaTypeContent(req.params.countrySlug, req.params.visaTypeSlug);
  return sendSuccess(res, 200, data);
});

const getVisaCountriesWithTypes = asyncHandler(async (_req, res) => {
  const items = await visaPortalService.searchPublicVisaTypes({});
  const grouped = new Map();

  for (const item of items) {
    if (!grouped.has(item.countrySlug)) {
      grouped.set(item.countrySlug, {
        countrySlug: item.countrySlug,
        countryName: item.countryName,
        visaTypes: [],
      });
    }

    grouped.get(item.countrySlug).visaTypes.push({
      visaTypeSlug: item.visaTypeSlug,
      visaTypeName: item.visaTypeName,
      title: item.title,
      sortOrder: item.sortOrder,
    });
  }

  const data = Array.from(grouped.values());
  return sendSuccess(res, 200, data);
});

module.exports = {
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
