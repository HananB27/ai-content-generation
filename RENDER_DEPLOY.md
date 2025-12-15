# Deploy Backend to Render (FREE)

## Quick Setup Guide

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (easiest)

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository

### Step 3: Configure Service

**Basic Settings:**
- **Name**: `ai-content-platform-backend` (or any name)
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main` (or your default branch)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`

**Advanced Settings:**
- **Auto-Deploy**: `Yes` (deploys on every push)

### Step 4: Add Environment Variables

Click **"Environment"** tab and add:

```
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_neon_database_url_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
```

**Note:** Render automatically sets `PORT` environment variable, so you don't need to add it.

### Step 5: Deploy with Docker (For FFmpeg Support)

Since Render's free tier doesn't include ffmpeg by default, use Docker:

1. In Render dashboard, go to your service settings
2. Change **Environment** from `Node` to **`Docker`**
3. Render will automatically detect the `Dockerfile` in the `server` folder
4. Deploy!

The Dockerfile I created includes ffmpeg installation.

### Step 6: Get Your Backend URL

After deployment, Render gives you a URL like:
- `https://ai-content-platform-backend.onrender.com`

**Update your frontend:**
- In Vercel, add environment variable:
  - `REACT_APP_API_URL=https://ai-content-platform-backend.onrender.com/api`

---

## Free Tier Limits

- **750 hours/month** (enough for 24/7 operation)
- **Spins down after 15 min inactivity** (wakes up on first request - takes ~30 seconds)
- **512MB RAM**
- **Free SSL certificate**

---

## Troubleshooting

### FFmpeg Not Found
- Make sure you're using **Docker** deployment (not Node)
- The Dockerfile includes ffmpeg installation

### Service Keeps Crashing
- Check logs in Render dashboard
- Make sure all environment variables are set
- Verify DATABASE_URL is correct

### Slow First Request
- This is normal - free tier spins down after inactivity
- First request after spin-down takes ~30 seconds to wake up
- Subsequent requests are fast

---

## Alternative: Railway (Better Performance)

Railway gives $5/month free credit and doesn't spin down:

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo
4. Add service → Select repo
5. Set Root Directory: `server`
6. Add environment variables (same as above)
7. Deploy!

Railway automatically detects Dockerfile and includes ffmpeg.

