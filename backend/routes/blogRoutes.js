const express = require('express');
const router = express.Router();
const { 
    createBlog,
    getBlogs,
    getBlogBySlug,
    updateBlog,
    deleteBlog,
    uploadBlogImage,
    likeBlog,
    getRelatedBlogs,
    getUserBlogs,
    incrementBlogViews,
    getBlogsByTag
} = require('../controllers/blogController');
const { protect, admin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');

// Public routes
router.get('/',cacheMiddleware('allblogs'), getBlogs); // Get all blogs with pagination and filtering
router.get('/tag/:tag', getBlogsByTag); // Get blogs by tag with pagination
router.get('/related/:slug', getRelatedBlogs); // Get related blogs based on tags
router.get('/:slug', getBlogBySlug); // Get a single blog by slug
router.post('/views/:id', incrementBlogViews); // Increment blog views

// Protected routes
router.get('/user/myblogs', getUserBlogs); // Get blogs by logged in user
router.post('/', upload.single('BlogCoverImage'),protect, createBlog); // Create a blog
router.put('/:id', upload.single('BlogCoverImage'),protect, updateBlog); // Update a blog
router.delete('/:id',protect, deleteBlog); // Delete a blog
router.post('/like/:id', protect,likeBlog); // Like a blog
router.post('/upload-image',upload.single('Blogimage'),protect, uploadBlogImage); // Upload an image for blog content

module.exports = router; 