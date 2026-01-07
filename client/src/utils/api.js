const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999/api';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const api = {
  
  async register(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async generateContent(prompt) {
    const response = await fetch(`${API_BASE_URL}/content/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt }),
    });
    return response.json();
  },

  async getMyContent() {
    const response = await fetch(`${API_BASE_URL}/content/my-content`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async updateContent(contentId, updates) {
    const response = await fetch(`${API_BASE_URL}/content/${contentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  async createVideo(contentId, backgroundMusic, backgroundVideo) {
    const response = await fetch(`${API_BASE_URL}/videos/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contentId, backgroundMusic, backgroundVideo }),
    });
    return response.json();
  },

  async getVideo(contentId) {
    const response = await fetch(`${API_BASE_URL}/videos/${contentId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async getVideoProgress(contentId) {
    const response = await fetch(`${API_BASE_URL}/videos/progress/${contentId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async getConnectedAccounts() {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async connectTikTok(accessToken, refreshToken, accountId, username) {
    const response = await fetch(`${API_BASE_URL}/accounts/tiktok/connect`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ accessToken, refreshToken, accountId, username }),
    });
    return response.json();
  },

  async connectYouTube(accessToken, refreshToken, accountId, username) {
    const response = await fetch(`${API_BASE_URL}/accounts/youtube/connect`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ accessToken, refreshToken, accountId, username }),
    });
    return response.json();
  },

  async disconnectAccount(platform) {
    const response = await fetch(`${API_BASE_URL}/accounts/${platform}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async publishVideo(contentId, platforms, title, description, tags) {
    const response = await fetch(`${API_BASE_URL}/publish`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contentId, platforms, title, description, tags }),
    });
    return response.json();
  },

  async getPublishedVideos() {
    const response = await fetch(`${API_BASE_URL}/publish/my-videos`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async deleteTikTokVideo(videoId) {
    const response = await fetch(`${API_BASE_URL}/publish/tiktok/${videoId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async getVideoPreview(videoId) {
    const response = await fetch(`${API_BASE_URL}/media/preview/${videoId}`);
    return response.json();
  },

  async getTrendingSounds(limit = 20) {
    const response = await fetch(`${API_BASE_URL}/tiktok/sounds/trending?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async searchTikTokSounds(query, limit = 20) {
    const response = await fetch(`${API_BASE_URL}/tiktok/sounds/search?query=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async getSoundDetails(soundId) {
    const response = await fetch(`${API_BASE_URL}/tiktok/sounds/${soundId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async generateAIVideo(prompt, autoPublish = false) {
    const response = await fetch(`${API_BASE_URL}/ai-generate/video`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, autoPublish }),
    });
    return response.json();
  },

  async getAIGenerationProgress(progressId) {
    const response = await fetch(`${API_BASE_URL}/ai-generate/progress/${progressId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};
