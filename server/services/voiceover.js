const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@deepgram/sdk');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const dotenv = require('dotenv');

dotenv.config();

let deepgramClient = null;
if (process.env.DEEPGRAM_API_KEY) {
  deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
}

const execAsync = promisify(exec);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let textToSpeechClient = null;
try {
  if (process.env.GOOGLE_CLOUD_TTS_ENABLED === 'true' && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const textToSpeech = require('@google-cloud/text-to-speech');
    textToSpeechClient = new textToSpeech.TextToSpeechClient();
  }
} catch (error) {
  console.log('Google Cloud TTS not available, using fallback method');
}

/**
 * Generate voiceover using text-to-speech
 * Uses Google Cloud TTS if available, otherwise falls back to ElevenLabs or placeholder
 */
async function generateVoiceover(text, outputPath, options = {}) {
  try {
    
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    if (textToSpeechClient) {
      try {
        const result = await generateVoiceoverWithGCP(text, outputPath, options);
        console.log('✅ Voiceover generated using: Google Cloud TTS');
        console.log(`   Duration: ${result.duration}s, Output: ${outputPath}`);
        return result;
      } catch (error) {
        console.log('⚠️ Google Cloud TTS failed, trying ElevenLabs...');
      }
    }

    if (process.env.DEEPGRAM_API_KEY) {
      try {
        console.log('🔑 Using Deepgram API');
        const result = await generateVoiceoverWithDeepgram(text, outputPath, options);
        console.log('✅ Voiceover generated using: Deepgram');
        console.log(`   Duration: ${result.duration}s, Output: ${outputPath}`);
        return result;
      } catch (error) {
        console.log('⚠️ Deepgram TTS failed:', error.message);
        console.log('   Trying ElevenLabs...');
      }
    }

    if (process.env.ELEVENLABS_API_KEY) {
      try {
        console.log('🔑 Using ElevenLabs API key:', process.env.ELEVENLABS_API_KEY.substring(0, 10) + '...');
        const result = await generateVoiceoverWithElevenLabs(text, outputPath, options);
        console.log('✅ Voiceover generated using: ElevenLabs');
        console.log(`   Duration: ${result.duration}s, Output: ${outputPath}`);
        return result;
      } catch (error) {
        console.log('⚠️ ElevenLabs TTS failed:', error.message);
        if (error.response) {
          console.log('   Status:', error.response.status);
          console.log('   Response:', JSON.stringify(error.response.data));
        }
        console.log('   Falling back to placeholder...');
      }
    }
    
    if (!process.env.DEEPGRAM_API_KEY && !process.env.ELEVENLABS_API_KEY) {
      console.log('ℹ️ No TTS service configured (DEEPGRAM_API_KEY or ELEVENLABS_API_KEY not set)');
    }

    const result = await generatePlaceholderVoiceover(text, outputPath);
    console.log('✅ Voiceover generated using: Placeholder (silent audio)');
    console.log(`   Duration: ${result.duration}s, Output: ${outputPath}`);
    return result;
  } catch (error) {
    console.error('❌ Error generating voiceover:', error);
    throw new Error('Failed to generate voiceover');
  }
}

/**
 * Generate voiceover using Google Cloud Text-to-Speech
 */
async function generateVoiceoverWithGCP(text, outputPath, options = {}) {
  if (!textToSpeechClient) {
    throw new Error('Google Cloud TTS client not initialized');
  }

  const request = {
    input: { text: text },
    voice: {
      languageCode: options.languageCode || 'en-US',
      name: options.voiceName || 'en-US-Neural2-D', 
      ssmlGender: options.gender || 'NEUTRAL'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: options.speakingRate || 1.0,
      pitch: options.pitch || 0.0,
      volumeGainDb: options.volumeGainDb || 0.0
    }
  };

  const [response] = await textToSpeechClient.synthesizeSpeech(request);
  
  await fs.writeFile(outputPath, response.audioContent, 'binary');

  const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
  const { stdout } = await execAsync(
    `${ffprobePath} -i "${outputPath}" -show_entries format=duration -v quiet -of csv="p=0"`
  );
  const duration = parseFloat(stdout.trim()) || 0;
  return {
    text: text,
    outputPath: outputPath,
    duration: duration,
    status: 'completed',
    method: 'google-cloud-tts'
  };
}

/**
 * Generate voiceover using Deepgram API
 * Handles text > 2000 chars by chunking
 */
async function generateVoiceoverWithDeepgram(text, outputPath, options = {}) {
  if (!deepgramClient) {
    throw new Error('Deepgram client not initialized');
  }

  const MAX_CHARS = 1900; 
  const ffmpegPath = findFfmpegPath();
  const ffprobePath = findFfprobePath();
  
  const chunks = [];
  if (text.length <= MAX_CHARS) {
    chunks.push(text);
  } else {
    
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > MAX_CHARS) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
  }

  console.log(`   Deepgram: Processing ${chunks.length} chunk(s)`);

  const tempFiles = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkPath = outputPath.replace('.mp3', `_chunk${i}.mp3`);
    tempFiles.push(chunkPath);
    
    const response = await deepgramClient.speak.request(
      { text: chunks[i] },
      {
        model: options.model || 'aura-2-atlas-en', 
        encoding: 'mp3',
      }
    );

    const stream = await response.getStream();
    const audioChunks = [];
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      audioChunks.push(value);
    }
    
    await fs.writeFile(chunkPath, Buffer.concat(audioChunks));
  }

  if (tempFiles.length === 1) {
    await fs.rename(tempFiles[0], outputPath);
  } else {
    
    const listPath = outputPath.replace('.mp3', '_list.txt');
    const listContent = tempFiles.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(listPath, listContent);
    
    await execAsync(`${ffmpegPath} -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}" -y`);
    
    for (const f of tempFiles) {
      await fs.unlink(f).catch(() => {});
    }
    await fs.unlink(listPath).catch(() => {});
  }

  const { stdout } = await execAsync(
    `${ffprobePath} -i "${outputPath}" -show_entries format=duration -v quiet -of csv="p=0"`
  );
  const duration = parseFloat(stdout.trim()) || 0;

  let wordTimings = [];
  try {
    console.log('   Getting word timings via Deepgram STT...');
    const audioBuffer = await fs.readFile(outputPath);
    const { result } = await deepgramClient.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
      }
    );
    
    if (result?.results?.channels?.[0]?.alternatives?.[0]?.words) {
      wordTimings = result.results.channels[0].alternatives[0].words.map(w => ({
        word: w.word,
        start: w.start,
        end: w.end
      }));
      console.log(`   Got ${wordTimings.length} word timings from STT`);
    }
  } catch (sttError) {
    console.log('   Could not get word timings:', sttError.message);
  }

  return {
    text: text,
    outputPath: outputPath,
    duration: duration,
    wordTimings: wordTimings,
    status: 'completed',
    method: 'deepgram'
  };
}

/**
 * Generate voiceover using ElevenLabs API with timestamps
 */
async function generateVoiceoverWithElevenLabs(text, outputPath, options = {}) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = options.voiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      text: text,
      model_id: options.modelId || 'eleven_turbo_v2_5',
      voice_settings: {
        stability: options.stability || 0.5,
        similarity_boost: options.similarityBoost || 0.75
      }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      }
    }
  );

  const data = response.data;
  
  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  await fs.writeFile(outputPath, audioBuffer);

  let wordTimings = [];
  if (data.alignment) {
    const { characters, character_start_times_seconds, character_end_times_seconds } = data.alignment;
    
    let currentWord = '';
    let wordStart = null;
    let wordEnd = null;
    
    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      const startTime = character_start_times_seconds[i];
      const endTime = character_end_times_seconds[i];
      
      if (char === ' ' || char === '\n') {
        if (currentWord.trim()) {
          wordTimings.push({
            word: currentWord.trim(),
            start: wordStart,
            end: wordEnd
          });
        }
        currentWord = '';
        wordStart = null;
      } else {
        if (wordStart === null) wordStart = startTime;
        wordEnd = endTime;
        currentWord += char;
      }
    }
    
    if (currentWord.trim()) {
      wordTimings.push({
        word: currentWord.trim(),
        start: wordStart,
        end: wordEnd
      });
    }
    
    console.log('📝 Word timings from ElevenLabs:');
    wordTimings.forEach((w, i) => {
      console.log(`   [${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] "${w.word}"`);
    });
  }

  const ffprobePath = findFfprobePath();
  const { stdout } = await execAsync(
    `${ffprobePath} -i "${outputPath}" -show_entries format=duration -v quiet -of csv="p=0"`
  );
  const duration = parseFloat(stdout.trim()) || 0;

  return {
    text: text,
    outputPath: outputPath,
    duration: duration,
    wordTimings: wordTimings, 
    status: 'completed',
    method: 'elevenlabs'
  };
}

/**
 * Generate placeholder voiceover (fallback)
 */
async function generatePlaceholderVoiceover(text, outputPath) {
  
  const wordCount = text.split(/\s+/).length;
  const estimatedDuration = Math.min(60, Math.max(5, Math.ceil((wordCount / 150) * 60)));

  const ffmpegPath = findFfmpegPath();
  const isMp3 = outputPath.endsWith('.mp3');
  const codec = isMp3 ? 'libmp3lame' : 'aac';

  const command = `${ffmpegPath} -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -t ${estimatedDuration} -c:a ${codec} -b:a 192k -y "${outputPath}"`;

  await execAsync(command);
  return {
    text: text,
    outputPath: outputPath,
    duration: estimatedDuration,
    status: 'completed',
    method: 'placeholder'
  };
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

  try {
    require('child_process').execSync('which ffprobe', { stdio: 'ignore' });
    return 'ffprobe';
  } catch (e) {
    return 'ffprobe'; 
  }
}

module.exports = {
  generateVoiceover,
  generateVoiceoverWithGCP,
  generateVoiceoverWithElevenLabs
};
