const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { generateVoiceover } = require('../services/voiceover');
const { composeVideo } = require('../services/videoComposer');
const { getBackgroundVideoPath, getVideoPreviewUrl } = require('../services/videoFetcher');
const { getBackgroundMusicPath } = require('../services/mediaMapper');
const { setProgress, getProgress, clearProgress } = require('../services/progressTracker');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

// Create video with selected background and music
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { contentId, backgroundMusic, backgroundVideo } = req.body;
    const userId = req.user.userId;

    if (!contentId || !backgroundMusic || !backgroundVideo) {
      return res.status(400).json({ 
        error: 'Content ID, background music, and background video are required' 
      });
    }

    // Get content generation
    const contentResult = await pool.query(
      'SELECT * FROM content_generations WHERE id = $1 AND user_id = $2',
      [contentId, userId]
    );

    if (contentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const content = contentResult.rows[0];

    // Update content with selected background and music
    await pool.query(
      `UPDATE content_generations 
       SET background_music = $1, background_video = $2, status = 'processing'
       WHERE id = $3`,
      [backgroundMusic, backgroundVideo, contentId]
    );

    // Initialize progress immediately (convert to string for consistency)
    const progressId = String(contentId);
    setProgress(progressId, 'Starting video creation process...', 0);
    
    // Return immediately and process in background
    res.json({
      success: true,
      message: 'Video creation started',
      contentId: contentId
    });

    // Small delay to ensure response is sent before starting heavy processing
    setTimeout(() => {
      // Process video creation in background
      (async () => {
        const startTime = Date.now();
        const estimatedTotalTime = 120000; // 2 minutes estimated total time
        
        try {
          console.log(`[${progressId}] Starting video creation process...`);
          
          // Step 1: Generate voiceover (0-25%)
          setProgress(progressId, 'Generating voiceover audio...', 5);
          await fs.mkdir(path.join(__dirname, '../temp'), { recursive: true });
          const voiceoverPath = path.join(__dirname, '../temp', `voiceover_${contentId}.mp3`);
          
          const voiceoverStart = Date.now();
          await generateVoiceover(content.generated_text, voiceoverPath);
          const voiceoverTime = Date.now() - voiceoverStart;
          const voiceoverProgress = Math.min(25, Math.round((voiceoverTime / estimatedTotalTime) * 25));
          setProgress(progressId, 'Voiceover generated', voiceoverProgress);

          // Step 2: Load background assets (25-40%)
          console.log(`[${progressId}] Loading background assets...`);
          setProgress(progressId, 'Loading background assets...', 30);
          const assetsStart = Date.now();
          const backgroundVideoPath = await getBackgroundVideoPath(backgroundVideo);
          const backgroundMusicPath = await getBackgroundMusicPath(backgroundMusic);
          const assetsTime = Date.now() - assetsStart;
          const assetsProgress = Math.min(40, voiceoverProgress + Math.round((assetsTime / estimatedTotalTime) * 15));
          setProgress(progressId, 'Background assets loaded', assetsProgress);

          // Step 3: Compose video (40-95%)
          console.log(`[${progressId}] Composing video...`);
          setProgress(progressId, 'Composing video (this may take a moment)...', 45);
          await fs.mkdir(path.join(__dirname, '../uploads'), { recursive: true });
          const outputPath = path.join(__dirname, '../uploads', `video_${contentId}.mp4`);
          
          const compositionStart = Date.now();
          let lastProgressUpdate = Date.now();
          let timeBasedProgress = 45;
          
          // Time-based progress updater for composition
          const timeProgressInterval = setInterval(() => {
            const elapsed = Date.now() - compositionStart;
            // Estimate composition takes ~60 seconds, update progress accordingly
            timeBasedProgress = Math.min(90, 45 + Math.round((elapsed / 60000) * 45));
            if (Date.now() - lastProgressUpdate > 1000) { // Update every second
              setProgress(progressId, 'Composing video...', timeBasedProgress);
              lastProgressUpdate = Date.now();
            }
          }, 1000);
          
          const videoPath = await composeVideo({
            backgroundVideoPath: backgroundVideoPath,
            backgroundMusicPath: backgroundMusicPath,
            voiceoverPath: voiceoverPath,
            outputPath: outputPath,
            duration: 60, // Limit to 60 seconds max
            onProgress: (percent, message) => {
              // Use actual ffmpeg progress (40-90%)
              const adjustedPercent = 40 + Math.round((percent / 100) * 50);
              clearInterval(timeProgressInterval);
              setProgress(progressId, message || 'Composing video...', adjustedPercent);
            }
          });
          
          clearInterval(timeProgressInterval);
          console.log(`[${progressId}] Video creation completed!`);
          setProgress(progressId, 'Finalizing video...', 95);
          
          // Step 4: Save to database (95-100%)
          await pool.query(
            `UPDATE content_generations 
             SET video_url = $1, voiceover_url = $2, status = 'completed'
             WHERE id = $3`,
            [videoPath, voiceoverPath, contentId]
          );
          
          setProgress(progressId, 'Video creation completed!', 100);

          // Update content with video URL
          await pool.query(
            `UPDATE content_generations 
             SET video_url = $1, voiceover_url = $2, status = 'completed'
             WHERE id = $3`,
            [videoPath, voiceoverPath, contentId]
          );

          // Keep progress for a bit so frontend can see completion
          setTimeout(() => {
            clearProgress(progressId);
          }, 5000);
        } catch (error) {
          console.error(`[${progressId}] Video creation error:`, error);
          setProgress(progressId, `Error: ${error.message}`, null);
          
          // Update status to failed
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

// Get video creation progress
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

// Get video by content ID
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



