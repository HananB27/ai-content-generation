const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { publishToTikTok, publishToYouTube } = require('../services/publisher');
const pool = require('../config/database');

// Publish video to platforms
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { contentId, platforms, title, description, tags } = req.body;
    const userId = req.user.userId;

    if (!contentId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ 
        error: 'Content ID and at least one platform are required' 
      });
    }

    // Get content generation with video
    const contentResult = await pool.query(
      'SELECT * FROM content_generations WHERE id = $1 AND user_id = $2',
      [contentId, userId]
    );

    if (contentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const content = contentResult.rows[0];

    if (!content.video_url) {
      return res.status(400).json({ error: 'Video not yet created' });
    }

    const results = [];

    // Publish to each platform
    for (const platform of platforms) {
      try {
        // Get account connection
        const accountResult = await pool.query(
          'SELECT * FROM connected_accounts WHERE user_id = $1 AND platform = $2',
          [userId, platform]
        );

        if (accountResult.rows.length === 0) {
          results.push({
            platform,
            success: false,
            error: `${platform} account not connected`
          });
          continue;
        }

        const account = accountResult.rows[0];

        let publishResult;
        if (platform === 'tiktok') {
          publishResult = await publishToTikTok({
            videoPath: content.video_url,
            accessToken: account.access_token,
            title: title || content.prompt,
            description: description || content.generated_text.substring(0, 200)
          });
        } else if (platform === 'youtube') {
          publishResult = await publishToYouTube({
            videoPath: content.video_url,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            title: title || content.prompt,
            description: description || content.generated_text,
            tags: tags || []
          });
        } else {
          results.push({
            platform,
            success: false,
            error: `Unsupported platform: ${platform}`
          });
          continue;
        }

        // Save published video record
        await pool.query(
          `INSERT INTO published_videos 
           (content_generation_id, user_id, platform, platform_video_id, title, description)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            contentId,
            userId,
            platform,
            publishResult.videoId,
            title || content.prompt,
            description || content.generated_text
          ]
        );

        results.push({
          platform,
          success: true,
          videoId: publishResult.videoId,
          url: publishResult.url
        });
      } catch (error) {
        console.error(`Error publishing to ${platform}:`, error);
        results.push({
          platform,
          success: false,
          error: error.message
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Publishing error:', error);
    res.status(500).json({ error: 'Failed to publish video' });
  }
});

// Get published videos
router.get('/my-videos', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT pv.*, cg.prompt, cg.generated_text
       FROM published_videos pv
       JOIN content_generations cg ON pv.content_generation_id = cg.id
       WHERE pv.user_id = $1
       ORDER BY pv.published_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching published videos:', error);
    res.status(500).json({ error: 'Failed to fetch published videos' });
  }
});

module.exports = router;



