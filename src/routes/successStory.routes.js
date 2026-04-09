const { Router } = require("express");
const { listSuccessStories } = require("../controllers/blog.controller.js");

const router = Router();

router.get("/", listSuccessStories);

module.exports = router;
