const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

router.get('/blog', blogController.renderBlogIndex);
router.get('/blog/:slug', blogController.renderBlogPost);

module.exports = router;
