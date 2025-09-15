const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a blog title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    excerpt: {
        type: String,
        required: [true, 'Please provide a blog excerpt'],
        maxlength: [500, 'Excerpt cannot be more than 500 characters']
    },
    content: {
        type: Array,
        required: [true, 'Blog content is required']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coverImage: {
        type: String,
        required: [true, 'Please provide a cover image']
    },
    tags: {
        type: [String],
        default: []
    },
    readTime: {
        type: Number,
        default: 5
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    templateId: {
        type: String,
        required: false,
        default: 'classic'
    },
    publishedAt: {
        type: Date,
        default: null
    },
    socials: {
        twitter: String,
        facebook: String,
        instagram: String,
        linkedin: String
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Calculate read time based on content length before saving
blogSchema.pre('save', function(next) {
    // Only calculate if content is provided and readTime hasn't been set manually
    if (this.content && (!this.readTime || this.readTime === 5)) {
        let totalWords = 0;
        
        // Count words in all paragraph and heading type blocks
        this.content.forEach(block => {
            if (block.type === 'paragraph' || block.type === 'heading') {
                totalWords += block.content.split(/\s+/).length;
            }
        });
        
        // Assuming average reading speed of 200 words per minute
        this.readTime = Math.ceil(totalWords / 200);
        
        // Minimum read time is 1 minute
        if (this.readTime < 1) this.readTime = 1;
    }
    
    next();
});

// Add virtual field for formatted date
blogSchema.virtual('formattedDate').get(function() {
    return this.publishedAt ? new Date(this.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';
});

// Indexes for efficient queries
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ author: 1, status: 1 });
blogSchema.index({ tags: 1, status: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ views: -1 });
blogSchema.index({ likes: -1 });

// Text index for search functionality
blogSchema.index({
    title: 'text',
    excerpt: 'text',
    content: 'text'
}, {
    weights: {
        title: 10,
        excerpt: 5,
        content: 1
    },
    name: "blog_search_index"
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog; 