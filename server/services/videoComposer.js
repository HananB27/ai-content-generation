const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');

// Auto-detect ffmpeg path (works on local dev and deployed environments)
function findFfmpegPath() {
  try {
    // Try to find ffmpeg in common locations
    const possiblePaths = [
      '/opt/homebrew/bin/ffmpeg', // macOS Homebrew
      '/usr/local/bin/ffmpeg', // macOS/Linux standard
      '/usr/bin/ffmpeg', // Linux standard
      'ffmpeg' // System PATH
    ];

    for (const ffmpegPath of possiblePaths) {
      try {
        execSync(`which ${ffmpegPath}`, { stdio: 'ignore' });
        return ffmpegPath;
      } catch (e) {
        // Try next path
      }
    }

    // If not found, try system PATH
    try {
      execSync('which ffmpeg', { stdio: 'ignore' });
      return 'ffmpeg'; // Use system PATH
    } catch (e) {
      console.warn('FFmpeg not found in common paths, using system PATH');
      return 'ffmpeg';
    }
  } catch (error) {
    console.warn('Error detecting ffmpeg path:', error.message);
    return 'ffmpeg'; // Fallback to system PATH
  }
}

function findFfprobePath() {
  try {
    const possiblePaths = [
      '/opt/homebrew/bin/ffprobe',
      '/usr/local/bin/ffprobe',
      '/usr/bin/ffprobe',
      'ffprobe'
    ];

    for (const ffprobePath of possiblePaths) {
      try {
        execSync(`which ${ffprobePath}`, { stdio: 'ignore' });
        return ffprobePath;
      } catch (e) {
        // Try next path
      }
    }

    try {
      execSync('which ffprobe', { stdio: 'ignore' });
      return 'ffprobe';
    } catch (e) {
      console.warn('FFprobe not found in common paths, using system PATH');
      return 'ffprobe';
    }
  } catch (error) {
    console.warn('Error detecting ffprobe path:', error.message);
    return 'ffprobe';
  }
}

// Set ffmpeg paths
const ffmpegPath = findFfmpegPath();
const ffprobePath = findFfprobePath();

if (ffmpegPath !== 'ffmpeg') {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath !== 'ffprobe') {
  ffmpeg.setFfprobePath(ffprobePath);
}

console.log(`Using ffmpeg: ${ffmpegPath}`);
console.log(`Using ffprobe: ${ffprobePath}`);

/**
 * Compose final video by combining:
 * - Background video
 * - Background music
 * - Voiceover audio
 */
async function composeVideo({
  backgroundVideoPath,
  backgroundMusicPath,
  voiceoverPath,
  outputPath,
  duration = 60, // default 60 seconds
  onProgress = null
}) {
  return new Promise((resolve, reject) => {
    try {
      let command = ffmpeg(backgroundVideoPath);

      // Add voiceover
      if (voiceoverPath) {
        command = command.input(voiceoverPath);
      }

      // Add background music
      if (backgroundMusicPath) {
        command = command.input(backgroundMusicPath);
      }

      command
        .complexFilter([
          // Scale background video to fit (1080x1920 for vertical videos)
          '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg]',
          // Mix audio: voiceover + background music (music at lower volume)
          voiceoverPath && backgroundMusicPath
            ? '[1:a]volume=1.0[voice];[2:a]volume=0.3[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[audio]'
            : voiceoverPath
            ? '[1:a]volume=1.0[audio]'
            : backgroundMusicPath
            ? '[1:a]volume=0.8[audio]'
            : null
        ].filter(Boolean))
        .outputOptions([
          '-map [bg]',
          '-map [audio]',
          '-c:v libx264',
          '-preset ultrafast', // Faster encoding for development
          '-crf 28', // Slightly lower quality for faster encoding
          '-c:a aac',
          '-b:a 128k', // Lower bitrate for faster encoding
          '-t', duration.toString(), // Limit to specified duration
          '-movflags +faststart' // Optimize for web playback
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command: ' + commandLine);
          if (onProgress) onProgress(0, 'Starting video composition...');
        })
        .on('progress', (progress) => {
          if (progress.percent !== undefined && progress.percent !== null) {
            const percent = Math.min(100, Math.max(0, Math.round(progress.percent)));
            console.log(`FFmpeg processing: ${percent}% done`);
            if (onProgress) {
              onProgress(percent, `Processing video: ${percent}%`);
            }
          } else if (progress.timemark) {
            // If percent not available, estimate from time
            const timeMatch = progress.timemark.match(/(\d+):(\d+):(\d+\.\d+)/);
            if (timeMatch) {
              const hours = parseInt(timeMatch[1]);
              const minutes = parseInt(timeMatch[2]);
              const seconds = parseFloat(timeMatch[3]);
              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
              const estimatedPercent = Math.min(100, Math.round((totalSeconds / duration) * 100));
              console.log(`FFmpeg processing: ~${estimatedPercent}% (time-based)`);
              if (onProgress) {
                onProgress(estimatedPercent, `Processing video: ~${estimatedPercent}%`);
              }
            }
          }
        })
        .on('end', () => {
          console.log('Video composition completed');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('Error composing video:', err);
          reject(err);
        })
        .run();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get video duration
 */
async function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration);
      }
    });
  });
}

module.exports = {
  composeVideo,
  getVideoDuration
};



