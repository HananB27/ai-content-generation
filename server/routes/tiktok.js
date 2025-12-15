const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { 
  searchTrendingSounds, 
  getTrendingSounds, 
  getSoundDetails 
} = require('../services/tiktokSounds');

/**
 * @swagger
 * /tiktok/sounds/trending:
 *   get:
 *     summary: Get trending TikTok sounds
 *     tags: [TikTok]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: List of trending sounds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TikTokSound'
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sounds/trending', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const sounds = await getTrendingSounds(limit);
    
    res.json({
      success: true,
      data: sounds,
      count: sounds.length
    });
  } catch (error) {
    console.error('Error fetching trending sounds:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trending sounds',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /tiktok/sounds/search:
 *   get:
 *     summary: Search for TikTok sounds
 *     tags: [TikTok]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: List of matching sounds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TikTokSound'
 *                 count:
 *                   type: integer
 *                 query:
 *                   type: string
 *       400:
 *         description: Missing search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sounds/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    const limit = parseInt(req.query.limit) || 20;

    if (!query) {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }

    const sounds = await searchTrendingSounds(query, limit);
    
    res.json({
      success: true,
      data: sounds,
      count: sounds.length,
      query: query
    });
  } catch (error) {
    console.error('Error searching sounds:', error);
    res.status(500).json({ 
      error: 'Failed to search sounds',
      message: error.message 
    });
  }
});

/**
 * @swagger
 * /tiktok/sounds/{soundId}:
 *   get:
 *     summary: Get details for a specific sound
 *     tags: [TikTok]
 *     parameters:
 *       - in: path
 *         name: soundId
 *         required: true
 *         schema:
 *           type: string
 *         description: TikTok sound ID
 *     responses:
 *       200:
 *         description: Sound details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TikTokSound'
 *       404:
 *         description: Sound not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/sounds/:soundId', authenticateToken, async (req, res) => {
  try {
    const { soundId } = req.params;
    const soundDetails = await getSoundDetails(soundId);
    
    if (!soundDetails) {
      return res.status(404).json({ 
        error: 'Sound not found' 
      });
    }

    res.json({
      success: true,
      data: soundDetails
    });
  } catch (error) {
    console.error('Error fetching sound details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sound details',
      message: error.message 
    });
  }
});

module.exports = router;
