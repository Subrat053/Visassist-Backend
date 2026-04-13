const { Router } = require("express");
const controllers = require("../controllers/visaType.controller.js");

const router = Router();

router.get("/", controllers.listPublicVisaTypes);
router.get("/:countrySlug/:visaTypeSlug", controllers.getPublicVisaTypeBySlugs);

module.exports = router;
