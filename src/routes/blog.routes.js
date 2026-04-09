const { Router } = require("express");
const { getBlogPostById, listBlogPosts, listSuccessStories } = require("../controllers/blog.controller.js");

const router = Router();

router.get("/posts", listBlogPosts);
router.get("/posts/:postId", getBlogPostById);
router.get("/success-stories", listSuccessStories);

module.exports = router;
