const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { getBackgroundVideoPath } = require('../services/videoFetcher');

// Get preview URL for a background video
router.get('/preview/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Ensure video exists (will generate if needed)
    const videoPath = await getBackgroundVideoPath(videoId);
    
    // Return the URL to serve the video file
    res.json({ 
      previewUrl: `/api/media/file/${videoId}`
    });
  } catch (error) {
    console.error('Error getting preview URL:', error);
    res.status(500).json({ error: 'Failed to get preview URL' });
  }
});

// Serve video files
router.get('/file/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoPath = await getBackgroundVideoPath(videoId);
    
    // Check if file exists
    try {
      await fs.access(videoPath);
    } catch {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Set appropriate headers for video streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Stream the video file
    const videoStream = require('fs').createReadStream(videoPath);
    videoStream.pipe(res);
  } catch (error) {
    console.error('Error serving video file:', error);
    res.status(500).json({ error: 'Failed to serve video' });
  }
});

module.exports = router;

