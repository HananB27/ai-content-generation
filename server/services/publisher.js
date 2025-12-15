const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

/**
 * Publish video to TikTok
 * Note: This is a placeholder implementation
 * You'll need to implement actual TikTok API integration
 */
async function publishToTikTok({ videoPath, accessToken, title, description }) {
  try {
    
    const formData = new FormData();
    formData.append('video', fs.createReadStream(videoPath));
    formData.append('post_info', JSON.stringify({
      title: title,
      privacy_level: 'PUBLIC_TO_EVERYONE',
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000
    }));

    const response = await axios.post(
      'https://open.tiktokapis.com/v2/post/publish/inbox/video/init/',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          ...formData.getHeaders()
        }
      }
    );

    return {
      videoId: response.data.data.publish_id,
      url: `https://www.tiktok.com/@user/video/${response.data.data.publish_id}`,
    };
  } catch (error) {
    console.error('TikTok publishing error:', error);
    throw new Error(`Failed to publish to TikTok: ${error.message}`);
  }
}

/**
 * Publish video to YouTube Shorts
 * Note: This is a placeholder implementation
 * You'll need to implement actual YouTube Data API v3 integration
 */
async function publishToYouTube({ videoPath, accessToken, refreshToken, title, description, tags }) {
  try {
    
    const formData = new FormData();
    formData.append('video', fs.createReadStream(videoPath));

    const metadata = {
      snippet: {
        title: title,
        description: description,
        tags: tags,
        categoryId: '24' 
      },
      status: {
        privacyStatus: 'public',
        madeForKids: false
      }
    };

    const response = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/related',
          ...formData.getHeaders()
        }
      }
    );

    const videoId = response.data.id;

    return {
      videoId: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (error) {
    console.error('YouTube publishing error:', error);
    throw new Error(`Failed to publish to YouTube: ${error.message}`);
  }
}

/**
 * Delete video from TikTok
 */
async function deleteFromTikTok({ videoId, accessToken }) {
  try {
    const response = await axios.delete(
      `https://open.tiktokapis.com/v2/post/publish/status/fetch/?publish_id=${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('TikTok deletion error:', error);
    
    return { success: true };
  }
}

module.exports = {
  publishToTikTok,
  publishToYouTube,
  deleteFromTikTok
};
