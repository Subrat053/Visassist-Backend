const { Router } = require("express");
const { getCountryById, getCountryVisas, listCountries } = require("../controllers/country.controller.js");

const router = Router();

router.get("/", listCountries);
router.get("/:countryId", getCountryById);
router.get("/:countryId/visas", getCountryVisas);

module.exports = router;
