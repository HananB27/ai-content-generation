# Vercel Deployment Guide

## What is Vercel?

Vercel is a platform for deploying frontend applications (React, Next.js, etc.) with:
- Automatic HTTPS
- Global CDN
- Zero-config deployments
- Free tier available

## Deployment Options

### Option 1: Deploy Frontend Only (Recommended for now)

Since your backend needs to run Node.js with file processing, you'll deploy:
- **Frontend**: Vercel (React app)
- **Backend**: Railway, Render, or Fly.io (Node.js/Express)

### Option 2: Full Stack on Vercel

Vercel supports serverless functions, but your backend uses:
- File uploads/video processing (needs persistent storage)
- Long-running processes (video encoding)
- FFmpeg (system dependency)

**Recommendation**: Deploy frontend to Vercel, backend separately.

## Quick Deploy to Vercel

### Method 1: Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client folder
cd client

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Link to existing project? No
# - Project name? (press Enter)
# - Directory? ./
# - Override settings? No
```

### Method 2: Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your Git repository OR drag & drop the `client` folder
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Click "Deploy"

### Method 3: GitHub Integration (Best for updates)

1. Push your code to GitHub
2. Go to Vercel dashboard
3. Click "Add New Project"
4. Import from GitHub
5. Select your repository
6. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
7. Deploy

## Environment Variables

In Vercel dashboard, go to Project Settings > Environment Variables and add:

```
REACT_APP_API_URL=https://your-backend-url.com/api
```

## After Deployment

Your app will be live at:
- `https://your-app-name.vercel.app`
- Terms: `https://your-app-name.vercel.app/terms.html`
- Privacy: `https://your-app-name.vercel.app/privacy.html`

## Backend Deployment

For your backend, use:
- **Railway** (railway.app) - Easy Node.js deployment
- **Render** (render.com) - Free tier available
- **Fly.io** (fly.io) - Good for Docker

## Next Steps

1. Deploy frontend to Vercel (get URLs for TikTok API)
2. Deploy backend to Railway/Render
3. Update `REACT_APP_API_URL` in Vercel to point to your backend
4. Use the Vercel URLs for TikTok API registration

