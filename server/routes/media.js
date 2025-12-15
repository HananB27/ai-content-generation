const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { getBackgroundVideoPath, searchVideos, getBestVideoUrl, VIDEO_SEARCH_TERMS } = require('../services/pexelsVideos');

router.get('/preview/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const subwayDir = path.join(__dirname, '../media/youtube/subway_surfers');
    
    const videoFiles = {
      'subway_surfers_QPW3XwBoQlw': 'subway_surfers_QPW3XwBoQlw.mp4',
      'subway_surfers_i0M4ARe9v0Y': 'subway_surfers_i0M4ARe9v0Y.mp4',
      'subway_surfers_tiktok_7453104964236266774': 'subway_surfers_tiktok_7453104964236266774.mp4',
      'subway_surfers': 'subway_surfers_QPW3XwBoQlw.mp4', 
    };
    
    if (videoFiles[videoId]) {
      const filePath = path.join(subwayDir, videoFiles[videoId]);
      try {
        await fs.access(filePath);
        return res.json({ 
          previewUrl: `/api/media/static/youtube/subway_surfers/${videoFiles[videoId]}`,
          source: 'local'
        });
      } catch (e) {
        
      }
    }
    
    const videoPath = await getBackgroundVideoPath(videoId);
    
    res.json({ 
      previewUrl: `/api/media/file/${videoId}`,
      source: 'local'
    });
  } catch (error) {
    console.error('Error getting preview URL:', error);
    res.status(500).json({ error: 'Failed to get preview URL' });
  }
});

router.get('/file/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoPath = await getBackgroundVideoPath(videoId);
    
    try {
      await fs.access(videoPath);
    } catch {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    
    const videoStream = require('fs').createReadStream(videoPath);
    videoStream.pipe(res);
  } catch (error) {
    console.error('Error serving video file:', error);
    res.status(500).json({ error: 'Failed to serve video' });
  }
});

module.exports = router;
