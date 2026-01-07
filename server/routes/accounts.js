const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pool = require('../config/database');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT platform, account_username, account_id, created_at
       FROM connected_accounts
       WHERE user_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.post('/tiktok/connect', authenticateToken, async (req, res) => {
  try {
    const { accessToken, refreshToken, accountId, username } = req.body;
    const userId = req.user.userId;

    if (!accessToken || !accountId) {
      return res.status(400).json({ error: 'Access token and account ID are required' });
    }

    await pool.query(
      `INSERT INTO connected_accounts (user_id, platform, access_token, refresh_token, account_id, account_username)
       VALUES ($1, 'tiktok', $2, $3, $4, $5)
       ON CONFLICT (user_id, platform)
       DO UPDATE SET access_token = $2, refresh_token = $3, account_id = $4, account_username = $5`,
      [userId, accessToken, refreshToken, accountId, username]
    );

    res.json({ success: true, message: 'TikTok account connected' });
  } catch (error) {
    console.error('Error connecting TikTok account:', error);
    res.status(500).json({ error: 'Failed to connect TikTok account' });
  }
});

router.post('/youtube/connect', authenticateToken, async (req, res) => {
  try {
    const { accessToken, refreshToken, accountId, username } = req.body;
    const userId = req.user.userId;

    if (!accessToken || !accountId) {
      return res.status(400).json({ error: 'Access token and account ID are required' });
    }

    await pool.query(
      `INSERT INTO connected_accounts (user_id, platform, access_token, refresh_token, account_id, account_username)
       VALUES ($1, 'youtube', $2, $3, $4, $5)
       ON CONFLICT (user_id, platform)
       DO UPDATE SET access_token = $2, refresh_token = $3, account_id = $4, account_username = $5`,
      [userId, accessToken, refreshToken, accountId, username]
    );

    res.json({ success: true, message: 'YouTube account connected' });
  } catch (error) {
    console.error('Error connecting YouTube account:', error);
    res.status(500).json({ error: 'Failed to connect YouTube account' });
  }
});

router.post('/youtube/exchange-code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.userId;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    // Exchange the authorization code for tokens
    const axios = require('axios');
    const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
    const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
    const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/youtube-callback`;
    
    // Request access and refresh tokens from Google's OAuth server
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      redirect_uri: YOUTUBE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });
    
    const { access_token, refresh_token } = tokenResponse.data;

    console.log("HELLO2",);
    
    // Get the user's YouTube channel info
    const userInfoResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'snippet',
        mine: true
      },
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    console.log("HELLO3",userInfoResponse)

    // Extract channel information
    const channel = userInfoResponse.data.items[0];
    const accountId = channel.id;
    const username = channel.snippet.title;

    console.log("HELLO4",accountId)



    // Store in database
    await pool.query(
      `INSERT INTO connected_accounts (user_id, platform, access_token, refresh_token, account_id, account_username)
       VALUES ($1, 'youtube', $2, $3, $4, $5)
       ON CONFLICT (user_id, platform)
       DO UPDATE SET access_token = $2, refresh_token = $3, account_id = $4, account_username = $5`,
      [userId, access_token, refresh_token, accountId, username]
    );
    
    res.json({ 
      success: true, 
      message: 'YouTube account connected', 
      username 
    });
  } catch (error) {
    console.error('Error exchanging YouTube code:', error);
    
    // Provide more detailed error for debugging
    const errorMessage = error.response?.data?.error_description || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to connect YouTube account';
    
    res.status(500).json({ error: errorMessage });
  }
});

router.delete('/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.userId;

    await pool.query(
      'DELETE FROM connected_accounts WHERE user_id = $1 AND platform = $2',
      [userId, platform]
    );

    res.json({ success: true, message: `${platform} account disconnected` });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

module.exports = router;
