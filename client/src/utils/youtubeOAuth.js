// YouTube OAuth implementation
import {api, getAuthHeaders} from './api';

const YOUTUBE_CLIENT_ID = process.env.REACT_APP_YOUTUBE_CLIENT_ID;
const YOUTUBE_REDIRECT_URI = process.env.REACT_APP_YOUTUBE_REDIRECT_URI || `${window.location.origin}/youtube-callback`;

// Scopes needed for uploading videos and managing them
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl'
];

/**
 * Initiates the YouTube OAuth flow
 */
export const initiateYouTubeOAuth = () => {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', YOUTUBE_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', YOUTUBE_REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('prompt', 'consent');
  
  window.location.href = authUrl.toString();
};

/**
 * Handle the OAuth callback from YouTube/Google
 * @param {string} code - Authorization code from the callback
 * @returns {Promise} - Promise with the connection result
 */
export const handleYouTubeCallback = async (code) => {
  try {
    // Exchange the code for tokens on the backend
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:9999/api'}/accounts/youtube/exchange-code`, {
      method: 'POST',
      // headers: {
      //   'Content-Type': 'application/json',
      //   'Authorization': `Bearer ${localStorage.getItem('token')}`
      // },
      headers: getAuthHeaders(),
      body: JSON.stringify({ code })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to connect YouTube account');
    }
    
    return data;
  } catch (error) {
    console.error('YouTube callback error:', error);
    throw error;
  }
};
