# AI Content Generation Platform

A web application for generating TikTok and YouTube Shorts content using AI.

## Features

- AI-powered story generation using Google Gemini
- Background music selection (TikTok sounds)
- Background video selection (Minecraft, Subway Surfers, etc.)
- AI voiceover generation
- Direct publishing to TikTok and YouTube Shorts
- Account connection for TikTok and YouTube

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **AI**: Google Gemini

## Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation Steps

1. **Install dependencies:**
```bash
npm run install-all
```

2. **Set up environment variables:**

Create `.env` file in the `server` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/content_platform
JWT_SECRET=your_jwt_secret_here
PORT=9999
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
NODE_ENV=development
```

Create `.env` file in the `client` directory (optional, defaults to localhost:5000):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

3. **Set up PostgreSQL database:**
```bash
# Create database
createdb content_platform

# Or using psql:
psql -U postgres
CREATE DATABASE content_platform;
```

4. **Database tables will be created automatically** on first server start.

5. **Start the application:**
```bash
npm run dev
```

This will start both the frontend and backend concurrently.

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:9999

### Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file

### TikTok API Setup (Optional)

1. Register your app at [TikTok Developers](https://developers.tiktok.com/)
2. Create an app and get your Client Key and Client Secret
3. Add them to your `.env` file
4. Implement OAuth flow in the frontend (see `client/src/components/AccountSettings.js`)

### YouTube API Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add Client ID and Client Secret to your `.env` file
6. Implement OAuth flow in the frontend (see `client/src/components/AccountSettings.js`)

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # API utilities
│   │   └── App.js         # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic (Gemini, video composition, etc.)
│   ├── uploads/           # Generated videos
│   ├── temp/              # Temporary files
│   └── index.js           # Server entry point
└── package.json           # Root package.json
```

## Features Overview

### Content Generation
- Users can input prompts to generate engaging stories
- AI uses Google Gemini to create viral-worthy content
- Stories are optimized for short-form video platforms

### Video Creation
- Select from popular background music options
- Choose background videos (Minecraft, Subway Surfers, etc.)
- AI generates voiceover for the story
- Automatically composes final video with all elements

### Publishing
- Connect TikTok and YouTube accounts
- Publish videos directly to both platforms
- Customize titles, descriptions, and tags
- Track published videos in dashboard

## Development Notes

- The video composition service uses `ffmpeg` - make sure it's installed on your system
- Text-to-speech (voiceover) integration needs to be implemented (see `server/services/voiceover.js`)
- TikTok and YouTube OAuth flows need to be implemented in the frontend
- Background videos and music files need to be added to the server (currently using placeholder IDs)

