const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const MEDIA_DIR = path.join(__dirname, '../media');
const BACKGROUNDS_DIR = path.join(MEDIA_DIR, 'backgrounds');
const CACHE_DIR = path.join(MEDIA_DIR, 'cache');

// Video search terms for each background type
const VIDEO_SEARCH_TERMS = {
  minecraft_parkour: 'minecraft parkour gameplay',
  subway_surfers: 'subway surfers gameplay',
  abstract: 'abstract motion graphics',
  nature: 'nature landscape beautiful',
  city: 'city urban timelapse'
};

// Free video sources - using working video URLs
// Note: These are placeholder URLs. In production, you should:
// 1. Use Pexels API with a valid API key
// 2. Or host your own video files
// 3. Or use other free video sources
const FREE_VIDEO_URLS = {
  // Using sample videos from various free sources
  // For now, we'll generate placeholders and let users know they can add their own
  minecraft_parkour: null, // Will generate placeholder
  subway_surfers: null, // Will generate placeholder
  abstract: null, // Will generate placeholder
  nature: null, // Will generate placeholder
  city: null // Will generate placeholder
};

/**
 * Download video from URL and save locally
 */
async function downloadVideo(url, outputPath) {
  const ffmpegPath = '/opt/homebrew/bin/ffmpeg';
  // Use ffmpeg to download and process the video
  const command = `${ffmpegPath} -i "${url}" -c copy -t 30 "${outputPath}"`;
  
  try {
    await execAsync(command);
    return outputPath;
  } catch (error) {
    console.error(`Error downloading video:`, error);
    throw error;
  }
}

/**
 * Get video URL for preview (returns direct URL or null to generate placeholder)
 */
function getVideoPreviewUrl(id) {
  // If we have a URL, return it. Otherwise return null to generate placeholder
  return FREE_VIDEO_URLS[id] || null;
}

/**
 * Get background video path, downloading if needed
 */
async function getBackgroundVideoPath(id) {
  await fs.mkdir(BACKGROUNDS_DIR, { recursive: true });
  await fs.mkdir(CACHE_DIR, { recursive: true });
  
  const videoPath = path.join(BACKGROUNDS_DIR, `${id}.mp4`);
  
  try {
    await fs.access(videoPath);
    return videoPath;
  } catch {
    // File doesn't exist, try to download or generate placeholder
    const videoUrl = getVideoPreviewUrl(id);
    
    if (videoUrl) {
      // Try to download from URL
      console.log(`Downloading video for ${id}...`);
      try {
        return await downloadVideo(videoUrl, videoPath);
      } catch (error) {
        console.error(`Failed to download video for ${id}, generating placeholder...`);
      }
    }
    
    // Generate placeholder video
    console.log(`Generating placeholder video for ${id}...`);
    return await generatePlaceholderVideo(id, videoPath);
  }
}

/**
 * Generate placeholder video if download fails
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
  
  const ffmpegPath = '/opt/homebrew/bin/ffmpeg';
  const command = `${ffmpegPath} -f lavfi -i color=c=${color}:size=1080x1920:duration=30 -vf "drawtext=text='${name}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p "${outputPath}"`;
  
  await execAsync(command);
  return outputPath;
}

/**
 * Search for videos using Pexels API (if API key is provided)
 */
async function searchVideos(query, apiKey = null) {
  if (!apiKey) {
    // Return default URLs if no API key
    return { videos: Object.values(FREE_VIDEO_URLS).map(url => ({ video_files: [{ link: url }] })) };
  }
  
  try {
    const response = await axios.get('https://api.pexels.com/videos/search', {
      params: { query, per_page: 5 },
      headers: { Authorization: apiKey }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching Pexels:', error);
    return { videos: [] };
  }
}

module.exports = {
  getBackgroundVideoPath,
  getVideoPreviewUrl,
  searchVideos,
  VIDEO_SEARCH_TERMS
};

