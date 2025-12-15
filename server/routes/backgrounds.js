const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { processYouTubeBackground, getRandomBackgroundSegment } = require('../services/youtubeDownloader');
const fs = require('fs').promises;
const path = require('path');

const BACKGROUNDS_DIR = path.join(__dirname, '../media/backgrounds');

/**
 * @swagger
 * /backgrounds/setup:
 *   post:
 *     summary: Setup background videos from YouTube URLs
 *     tags: [Backgrounds]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 example: "https://www.youtube.com/watch?v=VIDEO_ID"
 *               category:
 *                 type: string
 *                 example: "subway_surfers"
 *               variation:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Videos processed successfully
 */
router.post('/setup', authenticateToken, async (req, res) => {
  try {
    const { url, category, variation = 1 } = req.body;

    if (!url || !category) {
      return res.status(400).json({ error: 'URL and category are required' });
    }

    const segments = await processYouTubeBackground(url, category, variation);

    res.json({
      success: true,
      message: `Processed ${segments.length} segments`,
      segments: segments.map(s => ({
        id: s.id,
        segmentNumber: s.segmentNumber
      }))
    });
  } catch (error) {
    console.error('Error setting up background:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /backgrounds/list:
 *   get:
 *     summary: List available background videos
 *     tags: [Backgrounds]
 *     responses:
 *       200:
 *         description: List of available backgrounds
 */
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const categories = {};
    
    try {
      const dirs = await fs.readdir(BACKGROUNDS_DIR);
      
      for (const dir of dirs) {
        const categoryPath = path.join(BACKGROUNDS_DIR, dir);
        const stat = await fs.stat(categoryPath);
        
        if (stat.isDirectory()) {
          const files = await fs.readdir(categoryPath);
          const videoFiles = files.filter(f => f.endsWith('.mp4'));
          
          if (videoFiles.length > 0) {
            categories[dir] = {
              count: videoFiles.length,
              files: videoFiles.map(f => ({
                name: f,
                path: `/api/media/static/backgrounds/${dir}/${f}`
              }))
            };
          }
        }
      }
    } catch (error) {
      
    }

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error listing backgrounds:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
