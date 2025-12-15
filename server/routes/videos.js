const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { generateVoiceover } = require('../services/voiceover');
const { composeVideo } = require('../services/videoComposer');
const { getBackgroundVideoPath, getVideoPreviewUrl } = require('../services/pexelsVideos');
const { getBackgroundMusicPath } = require('../services/mediaMapper');
const { setProgress, getProgress, clearProgress } = require('../services/progressTracker');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

/**
 * @swagger
 * /videos/create:
 *   post:
 *     summary: Create a video with selected background and music
 *     tags: [Videos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *               - backgroundMusic
 *               - backgroundVideo
 *             properties:
 *               contentId:
 *                 type: integer
 *                 description: ID of the generated content
 *               backgroundMusic:
 *                 type: string
 *                 example: "chill"
 *               backgroundVideo:
 *                 type: string
 *                 example: "subway_surfers"
 *     responses:
 *       200:
 *         description: Video creation started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 contentId:
 *                   type: integer
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { contentId, backgroundMusic, backgroundVideo } = req.body;
    const userId = req.user.userId;

    if (!contentId || !backgroundMusic || !backgroundVideo) {
      return res.status(400).json({ 
        error: 'Content ID, background music, and background video are required' 
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

    await pool.query(
      `UPDATE content_generations 
       SET background_music = $1, background_video = $2, status = 'processing'
       WHERE id = $3`,
      [backgroundMusic, backgroundVideo, contentId]
    );

    const progressId = String(contentId);
    setProgress(progressId, 'Starting video creation process...', 0);
    
    res.json({
      success: true,
      message: 'Video creation started',
      contentId: contentId
    });

    setTimeout(() => {
      
      (async () => {
        const startTime = Date.now();
        const estimatedTotalTime = 120000; 
        
        try {
          
          setProgress(progressId, 'Generating voiceover audio...', 5);
          await fs.mkdir(path.join(__dirname, '../temp'), { recursive: true });
          const voiceoverPath = path.join(__dirname, '../temp', `voiceover_${contentId}.mp3`);
          
          const { generateVoiceoverScript } = require('../services/gemini');
          const voiceoverText = generateVoiceoverScript(content.generated_text);
          
          const voiceoverStart = Date.now();
          const voiceoverResult = await generateVoiceover(voiceoverText, voiceoverPath);
          const voiceoverTime = Date.now() - voiceoverStart;
          const voiceoverProgress = Math.min(25, Math.round((voiceoverTime / estimatedTotalTime) * 25));
          setProgress(progressId, 'Voiceover generated', voiceoverProgress);
          
          const wordTimings = voiceoverResult.wordTimings || null;

          setProgress(progressId, 'Loading background assets...', 30);
          const assetsStart = Date.now();
          const backgroundVideoPath = await getBackgroundVideoPath(backgroundVideo);
          
          const { getMusicPathOrUrl } = require('../services/tiktokMusicHelper');
          const backgroundMusicPath = await getMusicPathOrUrl(backgroundMusic);
          const assetsTime = Date.now() - assetsStart;
          const assetsProgress = Math.min(40, voiceoverProgress + Math.round((assetsTime / estimatedTotalTime) * 15));
          setProgress(progressId, 'Background assets loaded', assetsProgress);

          setProgress(progressId, 'Composing video (this may take a moment)...', 45);
          await fs.mkdir(path.join(__dirname, '../uploads'), { recursive: true });
          const outputPath = path.join(__dirname, '../uploads', `video_${contentId}.mp4`);
          
          const compositionStart = Date.now();
          let lastProgressUpdate = Date.now();
          let timeBasedProgress = 45;
          
          const timeProgressInterval = setInterval(() => {
            const elapsed = Date.now() - compositionStart;
            
            timeBasedProgress = Math.min(90, 45 + Math.round((elapsed / 60000) * 45));
            if (Date.now() - lastProgressUpdate > 1000) { 
              setProgress(progressId, 'Composing video...', timeBasedProgress);
              lastProgressUpdate = Date.now();
            }
          }, 1000);
          
          const { parseRedditStory } = require('../services/gemini');
          const { title, body } = parseRedditStory(content.generated_text);
          
          const titleWords = title ? title.split(/\s+/).length : 0;
          const titleReadTime = titleWords > 0 ? Math.ceil(titleWords / 2.5) + 1.5 : 0;
          
          const videoPath = await composeVideo({
            backgroundVideoPath: backgroundVideoPath,
            backgroundMusicPath: backgroundMusicPath,
            voiceoverPath: voiceoverPath,
            outputPath: outputPath,
            duration: 120, 
            text: body, 
            wordTimings: wordTimings, 
            title: title, 
            cardDuration: titleReadTime, 
            onProgress: (percent, message) => {
              
              const adjustedPercent = 40 + Math.round((percent / 100) * 50);
              clearInterval(timeProgressInterval);
              setProgress(progressId, message || 'Composing video...', adjustedPercent);
            }
          });
          
          clearInterval(timeProgressInterval);
          setProgress(progressId, 'Finalizing video...', 95);
          
          await pool.query(
            `UPDATE content_generations 
             SET video_url = $1, voiceover_url = $2, status = 'completed'
             WHERE id = $3`,
            [videoPath, voiceoverPath, contentId]
          );
          
          setProgress(progressId, 'Video creation completed!', 100);

          await pool.query(
            `UPDATE content_generations 
             SET video_url = $1, voiceover_url = $2, status = 'completed'
             WHERE id = $3`,
            [videoPath, voiceoverPath, contentId]
          );

          setTimeout(() => {
            clearProgress(progressId);
          }, 5000);
        } catch (error) {
          console.error(`[${progressId}] Video creation error:`, error);
          setProgress(progressId, `Error: ${error.message}`, null);
          
          try {
            await pool.query(
              `UPDATE content_generations SET status = 'failed' WHERE id = $1`,
              [contentId]
            );
          } catch (dbError) {
            console.error('Error updating database:', dbError);
          }
        }
      })();
    }, 100);
  } catch (error) {
    console.error('Video creation error:', error);
    res.status(500).json({ error: 'Failed to start video creation' });
  }
});

/**
 * @swagger
 * /videos/progress/{contentId}:
 *   get:
 *     summary: Get real-time video creation progress
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Progress information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VideoProgress'
 *       500:
 *         description: Server error
 */
router.get('/progress/:contentId', authenticateToken, (req, res) => {
  try {
    const { contentId } = req.params;
    const progressId = String(contentId);
    const progress = getProgress(progressId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

router.get('/:contentId', authenticateToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT video_url, voiceover_url, status 
       FROM content_generations 
       WHERE id = $1 AND user_id = $2`,
      [contentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

module.exports = router;
