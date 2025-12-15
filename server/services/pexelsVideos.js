const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const dotenv = require('dotenv');
const { getRandomBackgroundSegment } = require('./youtubeDownloader');

dotenv.config();

const execAsync = promisify(exec);
const PEXELS_API_BASE = 'https://api.pexels.com/videos';
const CACHE_DIR = path.join(__dirname, '../media/cache/backgrounds');

const VIDEO_SEARCH_TERMS = {
  subway_surfers: 'subway surfers gameplay'
};

/**
 * Search for videos on Pexels
 */
async function searchVideos(query, perPage = 5) {
  try {
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      console.warn('PEXELS_API_KEY not set, using placeholder videos');
      return { videos: [] };
    }

    const response = await axios.get(`${PEXELS_API_BASE}/search`, {
      params: {
        query,
        per_page: perPage,
        orientation: 'portrait' 
      },
      headers: {
        'Authorization': apiKey
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error searching Pexels videos:', error.response?.data || error.message);
    return { videos: [] };
  }
}

/**
 * Get video URL (prefer HD quality)
 */
function getBestVideoUrl(video) {
  
  const videoFiles = video.video_files || [];
  
  const hdVideo = videoFiles.find(v => v.quality === 'hd' || v.width >= 1080);
  if (hdVideo) return hdVideo.link;

  const anyVideo = videoFiles.find(v => v.file_type === 'video/mp4');
  if (anyVideo) return anyVideo.link;

  return null;
}

/**
 * Download video from Pexels
 */
async function downloadVideo(videoUrl, outputPath) {
  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const ffmpegPath = findFfmpegPath();
    const command = `${ffmpegPath} -i "${videoUrl}" -c copy -t 30 -y "${outputPath}"`;
    
    await execAsync(command);
    return outputPath;
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
}

function findFfmpegPath() {
  const possiblePaths = [
    '/opt/homebrew/bin/ffmpeg', 
    '/usr/local/bin/ffmpeg', 
    '/usr/bin/ffmpeg', 
    'ffmpeg' 
  ];

  for (const ffmpegPath of possiblePaths) {
    try {
      require('child_process').execSync(`which ${ffmpegPath}`, { stdio: 'ignore' });
      return ffmpegPath;
    } catch (e) {
      
    }
  }

  try {
    require('child_process').execSync('which ffmpeg', { stdio: 'ignore' });
    return 'ffmpeg';
  } catch (e) {
    return 'ffmpeg'; 
  }
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get background video path - prioritizes YouTube videos, then Pexels, then placeholder
 */
async function getBackgroundVideoPath(backgroundId) {
  const backgroundsDir = path.join(__dirname, '../media/backgrounds');
  await fs.mkdir(backgroundsDir, { recursive: true });
  await fs.mkdir(CACHE_DIR, { recursive: true });

  if (backgroundId.startsWith('subway_surfers_')) {
    
    const videoPath = path.join(__dirname, '../media/youtube/subway_surfers', `${backgroundId}.mp4`);
    if (await fileExists(videoPath)) {
      return videoPath;
    }
  }

  const categoryMap = {
    'subway_surfers': 'subway_surfers'
  };

  const category = categoryMap[backgroundId] || backgroundId;

  try {
    const youtubePath = await getRandomBackgroundSegment(category);
    if (youtubePath && await fileExists(youtubePath)) {
      return youtubePath;
    }
  } catch (error) {
    
  }

  const videoPath = path.join(backgroundsDir, `${backgroundId}.mp4`);
  
  if (await fileExists(videoPath)) {
    return videoPath;
  }

  const searchTerm = VIDEO_SEARCH_TERMS[backgroundId] || backgroundId;
  const pexelsData = await searchVideos(searchTerm, 1);

  if (pexelsData.videos && pexelsData.videos.length > 0) {
    const video = pexelsData.videos[0];
    const videoUrl = getBestVideoUrl(video);

    if (videoUrl) {
      try {
        return await downloadVideo(videoUrl, videoPath);
      } catch (error) {
        
      }
    }
  }

  return await generatePlaceholderVideo(backgroundId, videoPath);
}

/**
 * Generate placeholder video
 */
async function generatePlaceholderVideo(id, outputPath) {
  const colors = {
    subway_surfers: '0xFF9800'
  };

  const color = colors[id] || '0x2196F3';
  const name = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const ffmpegPath = findFfmpegPath();
  const command = `${ffmpegPath} -f lavfi -i color=c=${color}:size=1080x1920:duration=30 -vf "drawtext=text='${name}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -y "${outputPath}"`;

  await execAsync(command);
  return outputPath;
}

/**
 * Get video preview URL for frontend
 */
function getVideoPreviewUrl(backgroundId) {
  
  return null;
}

module.exports = {
  searchVideos,
  getBackgroundVideoPath,
  getVideoPreviewUrl,
  getBestVideoUrl,
  VIDEO_SEARCH_TERMS,
  fileExists
};
