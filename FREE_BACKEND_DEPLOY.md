# Free Backend Deployment Options

## Best Free Options for Your Backend

### Option 1: Render (Recommended - Easiest)

**Free Tier:**
- 750 hours/month free
- Spins down after 15 minutes of inactivity (wakes up on first request)
- Perfect for development/testing

**Deploy Steps:**
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repo OR use "Public Git repository"
4. Configure:
   - **Name**: `ai-content-platform-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: `server`
5. Add Environment Variables:
   - `GEMINI_API_KEY`
   - `DATABASE_URL` (from Neon)
   - `JWT_SECRET`
   - `PORT=10000` (Render sets this automatically, but good to have)
   - `TIKTOK_CLIENT_KEY`
   - `TIKTOK_CLIENT_SECRET`
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `NODE_ENV=production`
6. Deploy!

**Note:** Render free tier spins down after inactivity. First request after spin-down takes ~30 seconds.

---

### Option 2: Railway (Best Performance)

**Free Tier:**
- $5 free credit/month
- No spin-down
- Better for production

**Deploy Steps:**
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add service → Select your repo
5. Configure:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables (same as Render)
7. Deploy!

**Note:** Railway gives $5/month free credit. After that, you pay per usage (very cheap).

---

### Option 3: Fly.io (Good for Docker)

**Free Tier:**
- 3 shared-cpu VMs free
- 3GB persistent volume
- Good for apps with system dependencies (like ffmpeg)

**Deploy Steps:**
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Sign up: `fly auth signup`
3. In your project root, run: `fly launch`
4. Follow prompts
5. Deploy: `fly deploy`

---

## Recommended: Render (Easiest Setup)

Render is the easiest free option. Here's a quick setup:

### Quick Render Setup

1. **Create account** at render.com
2. **New Web Service**
3. **Connect GitHub** (or use public repo)
4. **Settings:**
   - Name: `ai-content-backend`
   - Environment: `Node`
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && node index.js`
   - Root Directory: `server`

5. **Environment Variables:**
   ```
   GEMINI_API_KEY=your_key
   DATABASE_URL=your_neon_url
   JWT_SECRET=your_secret
   PORT=10000
   NODE_ENV=production
   TIKTOK_CLIENT_KEY=your_key
   TIKTOK_CLIENT_SECRET=your_secret
   YOUTUBE_CLIENT_ID=your_id
   YOUTUBE_CLIENT_SECRET=your_secret
   ```

6. **Deploy!**

Your backend will be at: `https://ai-content-backend.onrender.com`

---

## Important Notes

### FFmpeg on Free Hosting

Free hosting services don't include ffmpeg by default. You have two options:

**Option A: Use Docker (Recommended)**
- Create a Dockerfile with ffmpeg installed
- Deploy as a Docker container

**Option B: Use a service with ffmpeg**
- Some services allow installing system packages
- Or use a service that supports Docker

### File Storage

For video files, you'll need:
- **AWS S3** (free tier: 5GB)
- **Cloudinary** (free tier: 25GB)
- **Backblaze B2** (free tier: 10GB)

Or store temporarily and delete after processing.

---

## Quick Start: Render Deployment

Want me to create the necessary files for Render deployment?

