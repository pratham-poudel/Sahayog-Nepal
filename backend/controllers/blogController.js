const Blog = require('../models/Blog');
const User = require('../models/User');
const { getPublicUrl } = require('../config/minioConfig');
const slugify = require('slugify');
const mongoose = require('mongoose');
const fileService = require('../services/fileService');



const generateUniqueSlug = async (title) => {
    // Create basic slug from title
    let slug = slugify(title, {
        lower: true,
        strict: false, // Allow non-Latin characters (e.g., Nepali)
        remove: /[*+~.()'"!:@]/g // Remove unwanted special characters
    });

    // Check if slug exists in the database
    const exists = await Blog.findOne({ slug });

    if (!exists) return slug; // Return if the slug is unique

    // If slug exists, append a unique identifier
    const timestamp = Date.now().toString().slice(-4);
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `${slug}-${timestamp}-${randomStr}`; // Add timestamp and random string for uniqueness
};


// Helper function for pagination
const getPagination = (page, size) => {
    const limit = size ? +size : 10;
    const offset = page ? (page - 1) * limit : 0;
    return { limit, offset };
};

// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res) => {
    try {
        const { title, excerpt, content, tags, templateId, status } = req.body;
        
        if (!title || !excerpt || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title, excerpt and content are required'
            });
        }
        
        // Parse content if it's sent as a string
        let parsedContent;
        try {
            parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid content format'
            });
        }
        
        // Handle tags
        let parsedTags = [];
        if (tags) {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }
        
        // Generate unique slug
        const slug = await generateUniqueSlug(title);
        
        // Get cover image path
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Make sure the file is sent with the field name "BlogCoverImage"'
            });
        }
        console.log('Blog Cover upload file:', req.file);
        const filename = req.fileData?.BlogCoverImage?.[0]?.filename || req.file.key.split('/').pop();
        const fileData = fileService.processUploadedFile(req.file);


        
        // Create blog object
        const blogData = {
            title,
            slug,
            excerpt,
            content: parsedContent,
            author: req.user._id,
            coverImage: filename,
            tags: parsedTags,
            templateId: templateId || 'classic',
            status: status || 'draft',
            publishedAt: status === 'published' ? new Date() : null,
            socials: {
                twitter: req.body.twitter || '',
                facebook: req.body.facebook || '',
                instagram: req.body.instagram || '',
                linkedin: req.body.linkedin || ''
            }
        };
        
        // Create blog
        const blog = await Blog.create(blogData);
        console.log('blog value is ',blog);
        
        // Populate author details
        const populatedBlog = await Blog.findById(blog._id).populate({
            path: 'author',
            select: 'name email profilePicture bio'
        });
        
        res.status(201).json({
            success: true,
            blog: populatedBlog
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating blog',
            error: error.message
        });
    }
};

// @desc    Get all blogs with pagination
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'published',
      sort = '-publishedAt',
      search = '',
      tag = ''
    } = req.query;

    // Convert limit to number
    const limitNum = Math.min(Number(limit), 20); // Ensure limit never exceeds 20
    const { offset } = getPagination(page, limitNum);

    const filter = { status };

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { title: { $regex: regex } },
        { excerpt: { $regex: regex } },
        { tags: { $in: [regex] } }
      ];
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    const totalBlogs = await Blog.countDocuments(filter);

    const blogs = await Blog.find(filter)
      .populate({
        path: 'author',
        select: 'name profilePicture bio socials'
      })
      .sort(sort)
      .skip(offset)
      .limit(limitNum); // limit is <= 20 guaranteed

    // Unique tags
    const publishedBlogs = await Blog.find({ status: 'published' }).select('tags');
    const tagSet = new Set();
    publishedBlogs.forEach(blog => {
      if (Array.isArray(blog.tags)) {
        blog.tags.forEach(tag => tagSet.add(tag));
      }
    });

    const allTags = Array.from(tagSet);

    res.status(200).json({
      success: true,
      totalItems: totalBlogs,
      totalPages: Math.ceil(totalBlogs / limitNum),
      currentPage: +page,
      blogs,
      tags: allTags
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    });
  }
};

  

// @desc    Get blogs by tag with pagination
// @route   GET /api/blogs/tag/:tag
// @access  Public
exports.getBlogsByTag = async (req, res) => {
    try {
        const { tag } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        // Calculate pagination values
        const { limit: limitNum, offset } = getPagination(page, limit);
        
        // Build filter
        const filter = { 
            status: 'published',
            tags: { $in: [tag] }
        };
        
        // Get total count for pagination
        const totalBlogs = await Blog.countDocuments(filter);
        
        // Get blogs with pagination
        const blogs = await Blog.find(filter)
            .populate({
                path: 'author',
                select: 'name profilePicture bio socials'
            })
            .sort('-publishedAt')
            .skip(offset)
            .limit(limitNum);
            
        res.status(200).json({
            success: true,
            totalItems: totalBlogs,
            totalPages: Math.ceil(totalBlogs / limitNum),
            currentPage: +page,
            blogs
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blogs by tag',
            error: error.message
        });
    }
};

// @desc    Get a single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        // Find blog by slug and populate author details
        const blog = await Blog.findOne({ slug })
            .populate({
                path: 'author',
                select: 'name email profilePicture bio socials'
            });
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Check if blog is published, if not published, only author can view
        if (blog.status !== 'published') {
            // If user is authenticated and is the author or admin
            if (req.user && (req.user._id.toString() === blog.author._id.toString() || req.user.isAdmin)) {
                // Allow access
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'This blog is not published yet'
                });
            }
        }
        
        // Get user socials from author field
        const userSocials = blog.author.socials || {};
        
        // Combine user socials with blog-specific socials
        // Blog-specific socials take precedence if they exist
        const combinedSocials = {
            twitter: blog.socials?.twitter || userSocials.twitter || '',
            facebook: blog.socials?.facebook || userSocials.facebook || '',
            instagram: blog.socials?.instagram || userSocials.instagram || '',
            linkedin: blog.socials?.linkedin || userSocials.linkedin || ''
        };
        
        // Format response
        const formattedBlog = {
            ...blog.toObject(),
            socials: combinedSocials,
            author: {
                ...blog.author.toObject(),
                socials: combinedSocials
            }
        };
        
        res.status(200).json({
            success: true,
            blog: formattedBlog
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blog',
            error: error.message
        });
    }
};

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, excerpt, content, tags, templateId, status } = req.body;
        
        // Find blog by id
        const blog = await Blog.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Check if user is the author
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this blog'
            });
        }
        
        // Parse content if it's sent as a string
        let parsedContent;
        try {
            parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
        } catch (error) {
            parsedContent = blog.content; // Keep existing content if parsing fails
        }
        
        // Handle tags
        let parsedTags = blog.tags;
        if (tags) {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }
        
        // Update slug if title changed
        let slug = blog.slug;
        if (title && title !== blog.title) {
            slug = await generateUniqueSlug(title);
        }
        
        // Check if cover image is being updated
        let coverImagePath = blog.coverImage;
        if (req.file && req.fileData && req.fileData.coverImage) {
            coverImagePath = getPublicUrl(req.fileData.coverImage[0].fullPath);
        }
        
        // Check if status is changing to published
        let publishedAt = blog.publishedAt;
        if (status === 'published' && (!publishedAt || blog.status !== 'published')) {
            publishedAt = new Date();
        }
        
        // Update social media links
        const socials = {
            twitter: req.body.twitter || blog.socials?.twitter || '',
            facebook: req.body.facebook || blog.socials?.facebook || '',
            instagram: req.body.instagram || blog.socials?.instagram || '',
            linkedin: req.body.linkedin || blog.socials?.linkedin || ''
        };
        
        // Update blog fields
        const updatedFields = {
            title: title || blog.title,
            slug,
            excerpt: excerpt || blog.excerpt,
            content: parsedContent,
            coverImage: coverImagePath,
            tags: parsedTags,
            templateId: templateId || blog.templateId,
            status: status || blog.status,
            publishedAt,
            socials
        };
        
        // Update blog in database
        const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            updatedFields,
            { new: true, runValidators: true }
        ).populate({
            path: 'author',
            select: 'name profilePicture bio socials'
        });
        
        res.status(200).json({
            success: true,
            blog: updatedBlog
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating blog',
            error: error.message
        });
    }
};

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find blog by id
        const blog = await Blog.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Check if user is the author or admin
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this blog'
            });
        }
        
        // Delete blog
        await Blog.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Blog deleted successfully'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting blog',
            error: error.message
        });
    }
};

// @desc    Upload image for blog content
// @route   POST /api/blogs/upload-image
// @access  Private
exports.uploadBlogImage = async (req, res) => {
    try {
        // Check if file exists in request
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }
        
        // Get file information
       const filename = req.fileData?.Blogimage[0]?.filename || req.file.key.split('/').pop();
       console.log('Blog image upload file:', req.file);
        
       const fileData = fileService.processUploadedFile(req.file);
        
        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl:fileData.url,
        });
        
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
};

// @desc    Like a blog
// @route   POST /api/blogs/like/:id
// @access  Private
exports.likeBlog = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find blog by id
        const blog = await Blog.findById(id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Increment likes
        blog.likes += 1;
        await blog.save();
        
        res.status(200).json({
            success: true,
            likes: blog.likes
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error liking blog',
            error: error.message
        });
    }
};

// @desc    Get related blogs based on tags
// @route   GET /api/blogs/related/:slug
// @access  Public
exports.getRelatedBlogs = async (req, res) => {
    try {
        const { slug } = req.params;
        const { limit = 6 } = req.query;
        
        // Find blog by slug to get its tags
        const blog = await Blog.findOne({ slug });
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Find related blogs with the same tags
        const relatedBlogs = await Blog.find({
            _id: { $ne: blog._id }, // Exclude the current blog
            status: 'published',
            tags: { $in: blog.tags }
        })
        .populate({
            path: 'author',
            select: 'name profilePicture'
        })
        .sort('-publishedAt')
        .limit(Number(limit));
        
        res.status(200).json({
            success: true,
            blogs: relatedBlogs
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching related blogs',
            error: error.message
        });
    }
};

// @desc    Get blogs by logged in user
// @route   GET /api/blogs/user/myblogs
// @access  Private
exports.getUserBlogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        
        // Build filter object
        const filter = { author: req.user._id };
        
        // Add status filter if provided
        if (status) {
            filter.status = status;
        }
        
        // Calculate pagination values
        const { limit: limitNum, offset } = getPagination(page, limit);
        
        // Get total count for pagination
        const totalBlogs = await Blog.countDocuments(filter);
        
        // Get user's blogs with pagination
        const blogs = await Blog.find(filter)
            .sort('-createdAt')
            .skip(offset)
            .limit(limitNum);
            
        res.status(200).json({
            success: true,
            totalItems: totalBlogs,
            totalPages: Math.ceil(totalBlogs / limitNum),
            currentPage: +page,
            blogs
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user blogs',
            error: error.message
        });
    }
};

// @desc    Increment blog views
// @route   POST /api/blogs/views/:id
// @access  Public
exports.incrementBlogViews = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find blog by id and increment views
        const blog = await Blog.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        );
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        res.status(200).json({
            success: true,
            views: blog.views
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error incrementing blog views',
            error: error.message
        });
    }
}; 