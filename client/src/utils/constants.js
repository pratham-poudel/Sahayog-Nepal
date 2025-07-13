import { API_URL as CONFIG_API_URL } from '../config/index.js';

// API base URL
export const API_URL = `${CONFIG_API_URL}/api`;

// Image placeholder
export const DEFAULT_PROFILE_IMAGE = 'https://ui-avatars.com/api/?name=User';

// Blog templates
export const BLOG_TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'A timeless, clean layout perfect for articles and stories',
    previewImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with bold elements and clear typography',
    previewImage: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simplified design focusing on content with minimal distractions',
    previewImage: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80'
  },
  {
    id: 'feature',
    name: 'Feature',
    description: 'Magazine-style layout perfect for featured articles and interviews',
    previewImage: 'https://images.unsplash.com/photo-1599008633840-052c7f756385?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80'
  },
  {
    id: 'photo',
    name: 'Photo Story',
    description: 'Visual-first template ideal for photo essays and travel blogs',
    previewImage: 'https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80'
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Optimized for technical writing with code snippets and diagrams',
    previewImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80'
  }
];

// Static content (can be replaced with API data)
export const POPULAR_TAGS = [
  'Fundraising',
  'Community',
  'Impact',
  'Stories',
  'Education',
  'Health',
  'Environment',
  'Technology',
  'Culture',
  'Disaster Relief'
];

// Default pagination size
export const DEFAULT_PAGE_SIZE = 6; 