import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

const BACKGROUND_MUSIC_OPTIONS = [
  { id: 'trending1', name: 'Trending Sound #1', description: 'Popular TikTok sound' },
  { id: 'trending2', name: 'Trending Sound #2', description: 'Viral audio track' },
  { id: 'upbeat', name: 'Upbeat Energy', description: 'High-energy background' },
  { id: 'chill', name: 'Chill Vibes', description: 'Relaxed atmosphere' },
  { id: 'dramatic', name: 'Dramatic Tension', description: 'Suspenseful music' },
];

const BACKGROUND_VIDEO_OPTIONS = [
  { id: 'minecraft_parkour', name: 'Minecraft Parkour', description: 'Popular gaming content' },
  { id: 'subway_surfers', name: 'Subway Surfers', description: 'Classic mobile game' },
  { id: 'abstract', name: 'Abstract Motion', description: 'Modern visual effects' },
  { id: 'nature', name: 'Nature Scenes', description: 'Beautiful landscapes' },
  { id: 'city', name: 'City Life', description: 'Urban environment' },
];

function VideoCreator({ content, onVideoCreated }) {
  const [backgroundMusic, setBackgroundMusic] = useState('');
  const [backgroundVideo, setBackgroundVideo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoPreviews, setVideoPreviews] = useState({});
  const [previewingVideo, setPreviewingVideo] = useState(null);
  const [progress, setProgress] = useState({ message: '', percent: 0 });
  const progressIntervalRef = useRef(null);

  // Load video preview URLs
  useEffect(() => {
    const loadPreviews = async () => {
      const previews = {};
      for (const video of BACKGROUND_VIDEO_OPTIONS) {
        try {
          const result = await api.getVideoPreview(video.id);
          previews[video.id] = result.previewUrl;
        } catch (err) {
          console.error(`Failed to load preview for ${video.id}:`, err);
        }
      }
      setVideoPreviews(previews);
    };
    loadPreviews();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleCreateVideo = async () => {
    if (!backgroundMusic || !backgroundVideo) {
      setError('Please select both background music and video');
      return;
    }

    setError('');
    setLoading(true);
    setProgress({ message: 'Starting video creation...', percent: 0 });

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    try {
      // Start video creation (non-blocking)
      await api.createVideo(content.id, backgroundMusic, backgroundVideo);
      
      // Start polling for progress updates immediately (with initial poll)
      const pollProgress = async () => {
        try {
          const progressData = await api.getVideoProgress(content.id);
          console.log('Progress update:', progressData);
          setProgress({
            message: progressData.message || 'Processing...',
            percent: progressData.percent !== null && progressData.percent !== undefined ? progressData.percent : 0
          });

          // If progress is 100%, video is complete
          if (progressData.percent === 100) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            setTimeout(() => {
              setLoading(false);
              onVideoCreated();
            }, 2000);
            return;
          }
        } catch (err) {
          // Progress polling failed, but video creation might still be running
          console.error('Error polling progress:', err);
        }
      };
      
      // Poll immediately, then set interval
      pollProgress();
      progressIntervalRef.current = setInterval(pollProgress, 500); // Poll every 500ms

      // Cleanup interval after 5 minutes (safety timeout)
      setTimeout(() => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }, 5 * 60 * 1000);
    } catch (err) {
      setError('Failed to create video. Please try again.');
      setLoading(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Video</h2>
        <p className="text-gray-600 mb-8">Select background music and video for your content</p>

        {/* Generated Story Preview */}
        <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Story</h3>
          <p className="text-gray-700 text-sm line-clamp-4">{content.generatedText}</p>
        </div>

        {/* Background Music Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Background Music</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BACKGROUND_MUSIC_OPTIONS.map((music) => (
              <div
                key={music.id}
                onClick={() => setBackgroundMusic(music.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  backgroundMusic === music.id
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{music.name}</h4>
                  {backgroundMusic === music.id && (
                    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-600">{music.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Background Video Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Background Video</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BACKGROUND_VIDEO_OPTIONS.map((video) => (
              <div
                key={video.id}
                className={`relative border-2 rounded-lg cursor-pointer transition-all overflow-hidden ${
                  backgroundVideo === video.id
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => setBackgroundVideo(video.id)}
                onMouseEnter={() => setPreviewingVideo(video.id)}
                onMouseLeave={() => setPreviewingVideo(null)}
              >
                {videoPreviews[video.id] && (
                  <div className="relative w-full h-48 bg-black">
                    <video
                      src={videoPreviews[video.id]}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay={previewingVideo === video.id}
                      playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{video.name}</h4>
                    {backgroundVideo === video.id && (
                      <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-800 font-medium">{progress.message || 'Processing...'}</p>
              <span className="text-blue-600 text-sm font-semibold">
                {Math.round(progress.percent || 0)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progress.percent || 0))}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          onClick={handleCreateVideo}
          disabled={loading || !backgroundMusic || !backgroundVideo}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating video...
            </span>
          ) : (
            'Create Video'
          )}
        </button>
      </div>
    </div>
  );
}

export default VideoCreator;



