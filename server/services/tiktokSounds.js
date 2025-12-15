const axios = require('axios');
const dotenv = require('dotenv');
const querystring = require('querystring');

dotenv.config();

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

/**
 * Get TikTok access token using client credentials
 */
async function getTikTokAccessToken() {
  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      throw new Error('TikTok API credentials not configured');
    }

    const formData = querystring.stringify({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    });

    const response = await axios.post(
      `${TIKTOK_API_BASE}/oauth/token/`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (response.data && response.data.data && response.data.data.access_token) {
      return response.data.data.access_token;
    } else if (response.data && response.data.data && response.data.data.accessToken) {
      return response.data.data.accessToken;
    } else if (response.data && response.data.access_token) {
      return response.data.access_token;
    } else if (response.data && response.data.accessToken) {
      return response.data.accessToken;
    } else {
      console.error('Unexpected TikTok API response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid response structure from TikTok API');
    }
  } catch (error) {
    console.error('Error getting TikTok access token:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('TikTok API Error Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error('Failed to get TikTok access token');
  }
}

/**
 * Search for trending sounds on TikTok
 * @param {string} query - Search query (optional)
 * @param {number} limit - Number of results (default: 20)
 */
async function searchTrendingSounds(query = '', limit = 20) {
  try {
    const accessToken = await getTikTokAccessToken();

    const response = await axios.get(
      `${TIKTOK_API_BASE}/research/music/search/`,
      {
        params: {
          query: query || undefined,
          max_count: Math.min(limit, 50) 
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data.music_list || [];
  } catch (error) {
    console.error('Error searching TikTok sounds:', error.response?.data || error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock TikTok sounds data');
      return getMockTrendingSounds(limit);
    }
    
    throw new Error('Failed to search TikTok sounds');
  }
}

/**
 * Get trending sounds (no search query)
 */
async function getTrendingSounds(limit = 20) {
  return searchTrendingSounds('', limit);
}

/**
 * Get sound details by ID
 */
async function getSoundDetails(soundId) {
  try {
    const accessToken = await getTikTokAccessToken();

    const response = await axios.get(
      `${TIKTOK_API_BASE}/research/music/query/`,
      {
        params: {
          music_ids: soundId
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data.music_list?.[0] || null;
  } catch (error) {
    console.error('Error getting sound details:', error.response?.data || error.message);
    throw new Error('Failed to get sound details');
  }
}

/**
 * Download sound audio file
 * Note: TikTok API may not provide direct download URLs
 * This is a placeholder for when we have the actual audio URL
 */
async function downloadSoundAudio(soundId, outputPath) {
  try {
    const soundDetails = await getSoundDetails(soundId);
    
    if (!soundDetails || !soundDetails.play_url) {
      throw new Error('Sound audio URL not available');
    }

    const response = await axios({
      method: 'GET',
      url: soundDetails.play_url,
      responseType: 'stream'
    });

    const fs = require('fs').promises;
    const writeStream = require('fs').createWriteStream(outputPath);
    
    response.data.pipe(writeStream);

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading sound audio:', error);
    throw new Error('Failed to download sound audio');
  }
}

/**
 * Mock trending sounds for development/testing
 */
function getMockTrendingSounds(limit = 20) {
  const mockSounds = [
    {
      id: 'mock_sound_1',
      title: 'Trending Sound #1',
      author: 'Popular Creator',
      duration: 30,
      cover_url: null, 
      play_url: null
    },
    {
      id: 'mock_sound_2',
      title: 'Viral Audio',
      author: 'Trending Artist',
      duration: 45,
      cover_url: null,
      play_url: null
    },
    {
      id: 'mock_sound_3',
      title: 'Popular Beat',
      author: 'Music Producer',
      duration: 60,
      cover_url: null,
      play_url: null
    },
    {
      id: 'chill',
      title: 'Chill Vibes',
      author: 'Default Sound',
      duration: 30,
      cover_url: null,
      play_url: null
    },
    {
      id: 'upbeat',
      title: 'Upbeat Energy',
      author: 'Default Sound',
      duration: 30,
      cover_url: null,
      play_url: null
    }
  ];

  return mockSounds.slice(0, limit);
}

module.exports = {
  searchTrendingSounds,
  getTrendingSounds,
  getSoundDetails,
  downloadSoundAudio
};
