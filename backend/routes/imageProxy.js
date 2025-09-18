const express = require('express');
const router = express.Router();
const axios = require('axios');

// Image proxy route to handle CORS issues
router.get('/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate that it's from our trusted domain
    if (!url.includes('filesatsahayognepal.dallytech.com')) {
      return res.status(403).json({ error: 'Only images from filesatsahayognepal.dallytech.com are allowed' });
    }

    // Fetch the image using axios
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 10000 // 10 second timeout
    });

    // Get the content type
    const contentType = response.headers['content-type'];
    
    // Validate it's an image
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not point to an image' });
    }

    // Set CORS headers to allow cross-origin requests
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    });

    // Stream the image data
    response.data.pipe(res);

  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;