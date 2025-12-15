const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const DOWNLOADS_DIR = path.join(__dirname, '../media/youtube');
const BACKGROUNDS_DIR = path.join(__dirname, '../media/backgrounds');

/**
 * Download YouTube video using yt-dlp
 */
async function downloadYouTubeVideo(url, outputPath) {
  try {
    
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const command = `yt-dlp -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' -o "${outputPath}" --no-playlist "${url}"`;

    console.log(`Downloading YouTube video: ${url}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.warn('yt-dlp warnings:', stderr);
    }

    try {
      await fs.access(outputPath);
      const stats = await fs.stat(outputPath);
      console.log(`Downloaded: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      return outputPath;
    } catch {
      
      const dir = path.dirname(outputPath);
      const baseName = path.basename(outputPath, path.extname(outputPath));
      const files = await fs.readdir(dir);
      const matchingFile = files.find(f => f.startsWith(baseName));
      
      if (matchingFile) {
        const actualPath = path.join(dir, matchingFile);
        
        await fs.rename(actualPath, outputPath);
        return outputPath;
      }
      
      throw new Error('Downloaded file not found');
    }
  } catch (error) {
    console.error(`Error downloading YouTube video ${url}:`, error.message);
    throw error;
  }
}

/**
 * Find ffmpeg/ffprobe path
 */
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

  return 'ffmpeg'; 
}

function findFfprobePath() {
  const possiblePaths = [
    '/opt/homebrew/bin/ffprobe',
    '/usr/local/bin/ffprobe',
    '/usr/bin/ffprobe',
    'ffprobe'
  ];

  for (const ffprobePath of possiblePaths) {
    try {
      require('child_process').execSync(`which ${ffprobePath}`, { stdio: 'ignore' });
      return ffprobePath;
    } catch (e) {
      
    }
  }

  return 'ffprobe'; 
}

/**
 * Cut video into segments of specified duration (in seconds)
 */
async function cutVideoIntoSegments(inputPath, outputDir, segmentDuration = 120, maxSegments = 10) {
  try {
    await fs.mkdir(outputDir, { recursive: true });

    const ffprobePath = findFfprobePath();
    const durationCommand = `${ffprobePath} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`;
    
    let videoDuration;
    try {
      const { stdout } = await execAsync(durationCommand);
      videoDuration = parseFloat(stdout.trim());
    } catch (error) {
      
      videoDuration = 1200; 
    }

    const segments = [];
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const numSegments = Math.min(Math.floor(videoDuration / segmentDuration), maxSegments);

    const ffmpegPath = findFfmpegPath();

    for (let i = 0; i < numSegments; i++) {
      const startTime = i * segmentDuration;
      const outputPath = path.join(outputDir, `${baseName}_segment_${i + 1}.mp4`);

      const command = `${ffmpegPath} -i "${inputPath}" -ss ${startTime} -t ${segmentDuration} -c copy -avoid_negative_ts make_zero -y "${outputPath}"`;

      try {
        await execAsync(command);

        const stats = await fs.stat(outputPath);
        if (stats.size > 0) {
          segments.push({
            path: outputPath,
            segmentNumber: i + 1,
            startTime: startTime,
            duration: segmentDuration
          });
        }
      } catch (error) {
        
      }
    }

    return segments;
  } catch (error) {
    console.error(`Error cutting video into segments:`, error.message);
    throw error;
  }
}

/**
 * Download and process YouTube video for background use
 */
async function processYouTubeBackground(url, category, variation = 1) {
  try {
    
    const categoryDir = path.join(DOWNLOADS_DIR, category);
    await fs.mkdir(categoryDir, { recursive: true });

    const videoId = extractVideoId(url);
    const downloadPath = path.join(categoryDir, `${category}_${videoId}.mp4`);
    
    try {
      await fs.access(downloadPath);
    } catch {
      await downloadYouTubeVideo(url, downloadPath);
    }

    const segmentsDir = path.join(BACKGROUNDS_DIR, category);
    await fs.mkdir(segmentsDir, { recursive: true });

    const segments = await cutVideoIntoSegments(downloadPath, segmentsDir, 120, 10);

    return segments.map(seg => ({
      id: `${category}_${variation}_${seg.segmentNumber}`,
      path: seg.path,
      category: category,
      variation: variation,
      segmentNumber: seg.segmentNumber
    }));
  } catch (error) {
    console.error(`Error processing YouTube background:`, error.message);
    throw error;
  }
}

/**
 * Extract video ID from YouTube or TikTok URL
 */
function extractVideoId(url) {
  
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];

  const tiktokPattern = /tiktok\.com\/@[\w.]+\/video\/(\d+)/;

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  const tiktokMatch = url.match(tiktokPattern);
  if (tiktokMatch) return `tiktok_${tiktokMatch[1]}`;

  return Date.now().toString(); 
}

/**
 * Get a random segment from a category
 */
async function getRandomBackgroundSegment(category) {
  try {
    const categoryDir = path.join(BACKGROUNDS_DIR, category);
    const files = await fs.readdir(categoryDir);
    const videoFiles = files.filter(f => f.endsWith('.mp4'));

    if (videoFiles.length === 0) {
      throw new Error(`No background videos found for category: ${category}`);
    }

    const randomFile = videoFiles[Math.floor(Math.random() * videoFiles.length)];
    return path.join(categoryDir, randomFile);
  } catch (error) {
    console.error(`Error getting random background segment:`, error.message);
    throw error;
  }
}

module.exports = {
  downloadYouTubeVideo,
  cutVideoIntoSegments,
  processYouTubeBackground,
  getRandomBackgroundSegment,
  extractVideoId
};
