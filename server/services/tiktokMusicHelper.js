const { getSoundDetails } = require('./tiktokSounds');

/**
 * Get TikTok sound URL for direct use in FFmpeg (no download needed!)
 * @param {string} soundId - TikTok sound ID
 * @returns {Promise<string|null>} - Audio URL or null if not available
 */
async function getTikTokSoundUrl(soundId) {
  try {
    const soundDetails = await getSoundDetails(soundId);
    
    if (soundDetails && soundDetails.play_url) {
      return soundDetails.play_url;
    }
    
    if (soundDetails && soundDetails.play_url_list && soundDetails.play_url_list.length > 0) {
      return soundDetails.play_url_list[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting TikTok sound URL for ${soundId}:`, error.message);
    return null;
  }
}

/**
 * Check if a music ID is a TikTok sound
 */
function isTikTokSound(musicId) {
  return musicId && (
    musicId.startsWith('tiktok_') || 
    /^\d+$/.test(musicId) || 
    musicId.includes('music_id')
  );
}

/**
 * Get music path or URL - prefers TikTok URL if available
 * @param {string} musicId - Music ID (can be TikTok sound ID or local file ID)
 * @returns {Promise<string>} - File path or URL
 */
async function getMusicPathOrUrl(musicId) {
  
  if (isTikTokSound(musicId)) {
    const soundId = musicId.replace('tiktok_', '');
    const tiktokUrl = await getTikTokSoundUrl(soundId);
    
    if (tiktokUrl) {
      return tiktokUrl; 
    }
  }
  
  const { getBackgroundMusicPath } = require('./mediaMapper');
  return await getBackgroundMusicPath(musicId);
}

module.exports = {
  getTikTokSoundUrl,
  isTikTokSound,
  getMusicPathOrUrl
};
