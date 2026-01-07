const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { publishToTikTok, publishToYouTube, deleteFromTikTok } = require('../services/publisher');
const pool = require('../config/database');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { contentId, platforms, title, description, tags } = req.body;
    const userId = req.user.userId;

    if (!contentId || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ 
        error: 'Content ID and at least one platform are required' 
      });
    }

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

    for (const platform of platforms) {
      try {
        
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
          // Check if video has proper dimensions for YouTube Shorts
          const ffmpeg = require('fluent-ffmpeg');
          const getVideoInfo = (videoPath) => {
            return new Promise((resolve, reject) => {
              ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) return reject(err);
                resolve(metadata);
              });
            });
          };
          
          try {
            const metadata = await getVideoInfo(content.video_url);
            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            
            if (videoStream) {
              const width = videoStream.width;
              const height = videoStream.height;
              const duration = parseFloat(videoStream.duration);
              
              // Ensure video meets YouTube Shorts criteria (vertical and <= 60s)
              if (height > width && duration <= 60) {
                console.log('Video qualifies as a YouTube Short');
              } else {
                console.log('Video does not meet YouTube Shorts criteria but will still be uploaded');
              }
            }
          } catch (probeErr) {
            console.warn('Could not determine video dimensions:', probeErr);
          }
          
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

router.delete('/tiktok/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.userId;

    const videoResult = await pool.query(
      `SELECT pv.*, ca.access_token
       FROM published_videos pv
       JOIN connected_accounts ca ON pv.user_id = ca.user_id AND ca.platform = 'tiktok'
       WHERE pv.id = $1 AND pv.user_id = $2 AND pv.platform = 'tiktok'`,
      [videoId, userId]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Published video not found' });
    }

    const publishedVideo = videoResult.rows[0];

    const { deleteFromTikTok } = require('../services/publisher');
    try {
      await deleteFromTikTok({
        videoId: publishedVideo.platform_video_id,
        accessToken: publishedVideo.access_token
      });
    } catch (error) {
      console.error('Error deleting from TikTok:', error);
      
    }

    await pool.query(
      'DELETE FROM published_videos WHERE id = $1',
      [videoId]
    );

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;
