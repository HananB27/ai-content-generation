const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pool = require('../config/database');

// Get connected accounts
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

// Connect TikTok account
router.post('/tiktok/connect', authenticateToken, async (req, res) => {
  try {
    const { accessToken, refreshToken, accountId, username } = req.body;
    const userId = req.user.userId;

    if (!accessToken || !accountId) {
      return res.status(400).json({ error: 'Access token and account ID are required' });
    }

    // Save or update TikTok connection
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

// Connect YouTube account
router.post('/youtube/connect', authenticateToken, async (req, res) => {
  try {
    const { accessToken, refreshToken, accountId, username } = req.body;
    const userId = req.user.userId;

    if (!accessToken || !accountId) {
      return res.status(400).json({ error: 'Access token and account ID are required' });
    }

    // Save or update YouTube connection
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

// Disconnect account
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



