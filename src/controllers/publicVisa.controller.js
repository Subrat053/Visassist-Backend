const asyncHandler = require("../utils/asyncHandler.js");
const { sendSuccess } = require("../utils/ApiResponse.js");
const visaPortalService = require("../services/visaPortal.service.js");

const listPublicCountries = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listPublicCountries(req.query);
  return sendSuccess(res, 200, data);
});

const getPublicCountryBySlug = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getPublicCountryBySlug(req.params.countrySlug);
  return sendSuccess(res, 200, data);
});

const listPublicVisaTypesByCountry = asyncHandler(async (req, res) => {
  const data = await visaPortalService.listPublicVisaTypesByCountry(req.params.countrySlug);
  return sendSuccess(res, 200, data);
});

const getPublicVisaTypeBySlugs = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getPublicVisaTypeContent(req.params.countrySlug, req.params.visaTypeSlug);
  return sendSuccess(res, 200, data);
});

const getPublicApplicationConfig = asyncHandler(async (req, res) => {
  const data = await visaPortalService.getPublicApplicationConfig(req.params.countrySlug, req.params.visaTypeSlug);
  return sendSuccess(res, 200, data);
});

const createPublicVisaApplication = asyncHandler(async (req, res) => {
  const data = await visaPortalService.createVisaApplication({
    payload: req.body,
    files: req.files || [],
    actorUserId: req.user?._id || null,
    source: "website",
  });

  return sendSuccess(res, 201, data);
});

const createPublicEnquiry = asyncHandler(async (req, res) => {
  const data = await visaPortalService.createPublicEnquiry(req.body, req.user?._id || null);
  return sendSuccess(res, 201, data);
});

const searchPublicVisaTypes = asyncHandler(async (req, res) => {
  const data = await visaPortalService.searchPublicVisaTypes(req.query);
  return sendSuccess(res, 200, data);
});

module.exports = {
  listPublicCountries,
  getPublicCountryBySlug,
  listPublicVisaTypesByCountry,
  getPublicVisaTypeBySlugs,
  getPublicApplicationConfig,
  createPublicVisaApplication,
  createPublicEnquiry,
  searchPublicVisaTypes,
};
