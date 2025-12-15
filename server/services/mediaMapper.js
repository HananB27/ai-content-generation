const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const MEDIA_DIR = path.join(__dirname, '../media');
const BACKGROUNDS_DIR = path.join(MEDIA_DIR, 'backgrounds');
const MUSIC_DIR = path.join(MEDIA_DIR, 'music');

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  await fs.mkdir(BACKGROUNDS_DIR, { recursive: true });
  await fs.mkdir(MUSIC_DIR, { recursive: true });
}

/**
 * Generate a placeholder video (solid color with text)
 */
async function generatePlaceholderVideo(id, outputPath) {
  const colors = {
    minecraft_parkour: '0x4CAF50',
    subway_surfers: '0xFF9800',
    abstract: '0x9C27B0',
    nature: '0x4CAF50',
    city: '0x607D8B'
  };
  
  const color = colors[id] || '0x2196F3';
  const name = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Generate a 10-second placeholder video with solid color and text
  const ffmpegPath = '/opt/homebrew/bin/ffmpeg';
  const command = `${ffmpegPath} -f lavfi -i color=c=${color}:size=1080x1920:duration=10 -vf "drawtext=text='${name}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p "${outputPath}"`;
  
  try {
    await execAsync(command);
    return outputPath;
  } catch (error) {
    console.error(`Error generating placeholder video for ${id}:`, error);
    throw error;
  }
}

/**
 * Generate a placeholder audio file (silence)
 */
async function generatePlaceholderAudio(id, outputPath) {
  const ffmpegPath = '/opt/homebrew/bin/ffmpeg';
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });
  
  // Remove file if it exists and is corrupted
  try {
    const stats = await fs.stat(outputPath);
    if (stats.size === 0) {
      await fs.unlink(outputPath);
    }
  } catch {
    // File doesn't exist, that's fine
  }
  
  // Generate 30 seconds of silence (longer for video composition)
  // Use libmp3lame codec for MP3 files
  const isMp3 = outputPath.endsWith('.mp3');
  const codec = isMp3 ? 'libmp3lame' : 'aac';
  const command = `${ffmpegPath} -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -t 30 -c:a ${codec} -b:a 192k -y "${outputPath}"`;
  
  try {
    await execAsync(command);
    
    // Verify file was created and has content
    const stats = await fs.stat(outputPath);
    if (stats.size === 0) {
      throw new Error('Generated file is empty');
    }
    
    return outputPath;
  } catch (error) {
    console.error(`Error generating placeholder audio for ${id}:`, error);
    // Clean up on error
    try {
      await fs.unlink(outputPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Get background video path, creating placeholder if needed
 */
async function getBackgroundVideoPath(id) {
  await ensureDirectories();
  const videoPath = path.join(BACKGROUNDS_DIR, `${id}.mp4`);
  
  try {
    await fs.access(videoPath);
    return videoPath;
  } catch {
    // File doesn't exist, generate placeholder
    console.log(`Generating placeholder video for ${id}...`);
    return await generatePlaceholderVideo(id, videoPath);
  }
}

/**
 * Get background music path, creating placeholder if needed
 */
async function getBackgroundMusicPath(id) {
  await ensureDirectories();
  const musicPath = path.join(MUSIC_DIR, `${id}.mp3`);
  
  try {
    await fs.access(musicPath);
    return musicPath;
  } catch {
    // File doesn't exist, generate placeholder
    console.log(`Generating placeholder audio for ${id}...`);
    return await generatePlaceholderAudio(id, musicPath);
  }
}

module.exports = {
  getBackgroundVideoPath,
  getBackgroundMusicPath
};

