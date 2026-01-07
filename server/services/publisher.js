const axios = require('axios');
const fs = require("fs");              // streams, existsSync, constants
const fsp = require("fs/promises");    // async/await file ops
const FormData = require('form-data');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// YouTube API configuration
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;

/**
 * Refresh the YouTube access token if it's expired
 */
async function refreshYouTubeToken(refreshToken) {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing YouTube token:', error);
    throw new Error('Could not refresh YouTube access token');
  }
}

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
 * Implementation using YouTube Data API v3 for uploading shorts videos
 */
async function publishToYouTube({ videoPath, accessToken, refreshToken, title, description, tags }) {
  try {
    // Validate video exists
    console.log(videoPath)

    await fsp.access(videoPath);

    // Try to use the provided token, but refresh it if needed
    let validToken = accessToken;
    try {
      // Attempt a small API call to check token validity
      await axios.get('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
    } catch (tokenError) {
      if (tokenError.response && tokenError.response.status === 401 && refreshToken) {
        console.log('YouTube token expired, attempting to refresh');
        validToken = await refreshYouTubeToken(refreshToken);
      } else {
        throw tokenError;
      }
    }

    // Create FormData
    const formData = new FormData();

    // Add video metadata
    const metadata = {
      snippet: {
        title: title,
        description: `${description}\n\n#Shorts`,
        tags: [...(tags || []), 'Shorts'],
        categoryId: '22' // People & Blogs category
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false
      }
    };

    // Converting metadata to JSON string
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));

    // Append parts to the form data
    formData.append('metadata', metadataBuffer, {
      contentType: 'application/json',
      knownLength: metadataBuffer.length
    });

    // Append the video file
    const videoStream = fs.createReadStream(videoPath);
    formData.append('media', videoStream, {
      contentType: 'video/mp4'
    });

    // Calculate the multipart boundary
    const boundary = formData.getBoundary();

    // Make the upload request
    const response = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const videoId = response.data.id;

    // If upload successful, attempt to set Shorts specific metadata
    try {
      // Add #Shorts hashtag to the description if not already present
      if (!description.includes('#Shorts')) {
        await axios.put(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet`,
          {
            id: videoId,
            snippet: {
              ...response.data.snippet,
              description: `${description}\n\n#Shorts`,
              tags: [...(tags || []), 'Shorts']
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (updateError) {
      console.warn('Could not update Shorts hashtag:', updateError.message);
      // Continue anyway, video is already uploaded
    }

    // Return video details
    return {
      videoId: videoId,
      url: `https://www.youtube.com/shorts/${videoId}`,
    };
  } catch (error) {
    console.error('YouTube publishing error:', error);

    // Provide more detailed error message
    const errorMessage = error.response?.data?.error?.message ||
                        error.response?.data?.error ||
                        error.message;

    throw new Error(`Failed to publish to YouTube: ${errorMessage}`);
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
  deleteFromTikTok,
  refreshYouTubeToken
};
