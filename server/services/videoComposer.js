const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');

function findFfmpegPath() {
  try {
    
    const possiblePaths = [
      '/opt/homebrew/bin/ffmpeg', 
      '/usr/local/bin/ffmpeg', 
      '/usr/bin/ffmpeg', 
      'ffmpeg' 
    ];

    for (const ffmpegPath of possiblePaths) {
      try {
        execSync(`which ${ffmpegPath}`, { stdio: 'ignore' });
        return ffmpegPath;
      } catch (e) {
        
      }
    }

    try {
      execSync('which ffmpeg', { stdio: 'ignore' });
      return 'ffmpeg'; 
    } catch (e) {
      console.warn('FFmpeg not found in common paths, using system PATH');
      return 'ffmpeg';
    }
  } catch (error) {
    console.warn('Error detecting ffmpeg path:', error.message);
    return 'ffmpeg'; 
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

const ffmpegPath = findFfmpegPath();
const ffprobePath = findFfprobePath();

if (ffmpegPath !== 'ffmpeg') {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (ffprobePath !== 'ffprobe') {
  ffmpeg.setFfprobePath(ffprobePath);
}
/**
 * Generate individual word timings based on voiceover duration
 * Each word gets equal time, synced to actual audio length
 */
function generateWordTimings(text, voiceoverDuration) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];
  
  const timePerWord = voiceoverDuration / words.length;
  
  return words.map((word, index) => ({
    word: word,
    start: index * timePerWord,
    end: (index + 1) * timePerWord,
    index: index
  }));
}

/**
 * Create title card filter - Reddit-style card at the beginning
 * Shows for cardDuration seconds then fades out
 */
function createTitleCardFilter(title, cardDuration = 5) {
  const fontPath = path.join(__dirname, '../fonts/Demo.ttf');
  
  let displayTitle = title.substring(0, 150).replace(/'/g, '').replace(/"/g, '');
  
  const words = displayTitle.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length > 35) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += ' ' + word;
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  
  const displayLines = lines.slice(0, 4);
  
  const filters = [];
  const fadeStart = cardDuration - 0.5;
  
  filters.push(`drawbox=x=(w-800)/2:y=(h-400)/2:w=800:h=400:color=white@0.95:t=fill:enable='between(t,0,${cardDuration})'`);
  
  filters.push(`drawbox=x=(w-800)/2:y=(h-400)/2:w=800:h=400:color=gray@0.3:t=4:enable='between(t,0,${cardDuration})'`);
  
  const lineHeight = 50;
  const startY = (1920 - (displayLines.length * lineHeight)) / 2 - 50;
  
  displayLines.forEach((line, idx) => {
    const yPos = startY + (idx * lineHeight);
    filters.push(`drawtext=text='${line}':fontfile=${fontPath}:fontsize=36:fontcolor=black:x=(w-text_w)/2:y=${yPos}:enable='between(t,0,${cardDuration})'`);
  });
  
  return { filters, cardDuration };
}

/**
 * Create drawtext filter - groups words by natural pauses
 * Shows upcoming words, respects pauses in speech
 * Starts AFTER the title card
 */
function createCaptionFilter(timings, cardDuration = 0) {
  if (!timings || timings.length === 0) return null;
  
  const filters = [];
  const maxWordsPerGroup = 6;
  const maxFilters = 500; 
  const pauseThreshold = 0.4;
  
  const fontPath = path.join(__dirname, '../fonts/Demo.ttf');
  
  let i = 0;
  while (i < timings.length && filters.length < maxFilters) {
    const words = [];
    const startTime = timings[i].start; 
    let endTime = timings[i].end;
    
    while (i < timings.length && words.length < maxWordsPerGroup) {
      let word = timings[i].word.replace(/[*_\[\]{}]/g, '').trim();
      
      if (/^\d{8}$/.test(word)) {
        const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
        const m = parseInt(word.slice(0,2)) - 1;
        const d = parseInt(word.slice(2,4));
        const y = word.slice(4);
        const suffix = d === 1 || d === 21 || d === 31 ? 'ST' : d === 2 || d === 22 ? 'ND' : d === 3 || d === 23 ? 'RD' : 'TH';
        word = `${months[m]} ${d}${suffix}, ${y}`;
      }
      
      word = word.replace(/[^a-zA-Z0-9.,!?-]/g, ' ').toUpperCase().trim();
      
      if (word) {
        words.push(word);
        endTime = timings[i].end;
      }
      
      const currentEnd = timings[i].end;
      i++;
      
      if (word && /[.!?]$/.test(word)) break;
      if (i < timings.length && (timings[i].start - currentEnd) > pauseThreshold) break;
    }
    
    if (words.length === 0) continue;
    
    let line1, line2;
    if (words.length > 3) {
      const mid = Math.ceil(words.length / 2);
      line1 = words.slice(0, mid).join(' ');
      line2 = words.slice(mid).join(' ');
    } else {
      line1 = words.join(' ');
      line2 = null;
    }
    
    const start = parseFloat(startTime.toFixed(2));
    const end = parseFloat(endTime.toFixed(2));
    const fadeIn = 0.05; 
    const fadeOut = 0.05; 
    
    const alphaExpr = `if(lt(t,${start + fadeIn}),(t-${start})/${fadeIn},if(gt(t,${end - fadeOut}),(${end}-t)/${fadeOut},1))`;
    
    filters.push(`drawtext=text='${line1}':fontfile=${fontPath}:fontsize=62:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=(h/2)-70:alpha='${alphaExpr}':enable='between(t,${start},${end})'`);
    
    if (line2) {
      filters.push(`drawtext=text='${line2}':fontfile=${fontPath}:fontsize=62:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=(h/2)+20:alpha='${alphaExpr}':enable='between(t,${start},${end})'`);
    }
  }
  
  return filters.length > 0 ? filters.join(',') : null;
}

/**
 * Get audio duration using ffprobe
 */
async function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        console.error('Error getting audio duration:', err);
        resolve(30); 
      } else {
        resolve(metadata.format.duration || 30);
      }
    });
  });
}

/**
 * Compose final video by combining:
 * - Background video
 * - Background music
 * - Voiceover audio
 * - Text captions (synced with voiceover)
 * - Reddit card overlay at start (optional)
 */
async function composeVideo({
  backgroundVideoPath,
  backgroundMusicPath,
  voiceoverPath,
  outputPath,
  duration = 60, 
  text = null, 
  wordTimings = null, 
  title = null, 
  cardDuration = 4, 
  onProgress = null
}) {
  
  let voiceoverDuration = duration;
  if (voiceoverPath) {
    try {
      voiceoverDuration = await getAudioDuration(voiceoverPath);
      
    } catch (e) {
      
    }
  }
  
  const finalDuration = voiceoverDuration + 0.5; 
  
  let cardImagePath = null;
  const actualCardDuration = title ? cardDuration : 0;
  
  if (title && cardDuration > 0) {
    try {
      const { generateRedditCardImage } = require('./redditCardGenerator');
      cardImagePath = path.join(__dirname, '../temp', `card_${Date.now()}.png`);
      await generateRedditCardImage(title, cardImagePath);
      
    } catch (err) {
      console.error('Failed to generate Reddit card:', err);
    }
  }

  return new Promise((resolve, reject) => {
    try {
      
      let command = ffmpeg()
        .input(backgroundVideoPath)
        .inputOptions([
          '-ss', '0.0',      
          '-stream_loop', '-1' 
        ]);

      if (voiceoverPath) {
        command = command.input(voiceoverPath);
        
      }

      if (backgroundMusicPath) {
        command = command.input(backgroundMusicPath);
        
      }

      if (cardImagePath) {
        command = command.input(cardImagePath);
        
      }

      let captionFilter = null;
      
      if (wordTimings && wordTimings.length > 0) {
        
        captionFilter = createCaptionFilter(wordTimings, 0);
        
      } else if (text && voiceoverDuration > 0) {
        const timings = generateWordTimings(text, voiceoverDuration);
        captionFilter = createCaptionFilter(timings, 0);
        
      }

      let videoFilter = '[0:v]trim=start=0,setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
      if (captionFilter) {
        videoFilter += ',' + captionFilter;
      }
      
      if (cardImagePath) {
        videoFilter += '[vid];';
        
        const fadeStart = actualCardDuration - 0.5;
        videoFilter += `[3:v]scale=900:-1,format=rgba,fade=t=out:st=${fadeStart}:d=0.5:alpha=1[card];`;
        videoFilter += `[vid][card]overlay=(W-w)/2:(H-h)/2:enable='lt(t,${actualCardDuration})':format=auto[bg]`;
      } else {
        videoFilter += '[bg]';
      }

      const filters = [videoFilter];
      
      const voiceIdx = 1;
      const musicIdx = cardImagePath ? 3 : 2;
      
      if (voiceoverPath && backgroundMusicPath) {
        filters.push(`[${voiceIdx}:a]volume=1.0[voice]`);
        filters.push(`[2:a]volume=0.2[music]`);
        filters.push('[voice][music]amix=inputs=2:duration=first[audio]');
      } else if (voiceoverPath) {
        filters.push(`[${voiceIdx}:a]volume=1.0[audio]`);
      } else if (backgroundMusicPath) {
        filters.push('[1:a]volume=0.8[audio]');
      }

      command
        .complexFilter(filters)
        .outputOptions([
          '-map [bg]',
          '-map [audio]',
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 192k',
          '-t', finalDuration.toString(),
          '-movflags +faststart'
        ])
        .output(outputPath)
        .on('start', () => {
          if (onProgress) onProgress(0, 'Starting video composition...');
        })
        .on('progress', (progress) => {
          if (progress.percent !== undefined && progress.percent !== null) {
            const percent = Math.min(100, Math.max(0, Math.round(progress.percent)));
            if (onProgress) {
              onProgress(percent, 'Processing video...');
            }
          } else if (progress.timemark) {
            const timeMatch = progress.timemark.match(/(\d+):(\d+):(\d+\.\d+)/);
            if (timeMatch) {
              const hours = parseInt(timeMatch[1]);
              const minutes = parseInt(timeMatch[2]);
              const seconds = parseFloat(timeMatch[3]);
              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
              const estimatedPercent = Math.min(100, Math.round((totalSeconds / finalDuration) * 100));
              if (onProgress) {
                onProgress(estimatedPercent, 'Processing video...');
              }
            }
          }
        })
        .on('end', () => {
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
