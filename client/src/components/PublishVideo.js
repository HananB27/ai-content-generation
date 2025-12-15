import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function PublishVideo({ content, onPublished }) {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [title, setTitle] = useState(content.prompt || '');
  const [description, setDescription] = useState(
    (content.generatedText || content.generated_text || '').substring(0, 500)
  );
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(true);

  useEffect(() => {
    loadAccounts();
    loadVideoUrl();
  }, []);

  const loadVideoUrl = async () => {
    try {
      setLoadingVideo(true);
      // Get video URL from content
      let videoPath = content.video_url;
      
      if (!videoPath) {
        // Try to fetch video info
        const videoInfo = await api.getVideo(content.id);
        videoPath = videoInfo.video_url;
      }
      
      if (videoPath) {
        // Extract filename from path (handle both absolute and relative paths)
        const filename = videoPath.split('/').pop() || videoPath.split('\\').pop();
        const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:9999/api';
        const videoStreamUrl = `${API_BASE}/videos/stream/${filename}`;
        setVideoUrl(videoStreamUrl);
      }
    } catch (error) {
      console.error('Error loading video URL:', error);
    } finally {
      setLoadingVideo(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const accounts = await api.getConnectedAccounts();
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const tagsArray = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
      const result = await api.publishVideo(
        content.id,
        selectedPlatforms,
        title,
        description,
        tagsArray
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result);
        setTimeout(() => {
          onPublished();
        }, 3000);
      }
    } catch (err) {
      setError('Failed to publish video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasTikTok = connectedAccounts.some((acc) => acc.platform === 'tiktok');
  const hasYouTube = connectedAccounts.some((acc) => acc.platform === 'youtube');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Preview Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Video Preview</h2>
          {loadingVideo ? (
            <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ aspectRatio: '9/16', minHeight: '400px' }}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading video...</p>
              </div>
            </div>
          ) : videoUrl ? (
            <div className="relative bg-black rounded-lg overflow-hidden shadow-xl" style={{ aspectRatio: '9/16' }}>
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                style={{ maxHeight: '600px' }}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ aspectRatio: '9/16', minHeight: '400px' }}>
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 font-medium">No video available</p>
                <p className="text-sm text-gray-400 mt-2">Make sure the video has been created first</p>
              </div>
            </div>
          )}
        </div>

        {/* Publish Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Publish Video</h2>
          <p className="text-gray-600 mb-8">Publish your video to TikTok and YouTube Shorts</p>

        {/* Platform Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Platforms</h3>
          <div className="space-y-4">
            <div
              onClick={() => hasTikTok && togglePlatform('tiktok')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPlatforms.includes('tiktok')
                  ? 'border-purple-600 bg-purple-50'
                  : hasTikTok
                  ? 'border-gray-200 hover:border-purple-300'
                  : 'border-gray-200 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-black rounded flex items-center justify-center text-white font-bold">
                    T
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">TikTok</h4>
                    {hasTikTok ? (
                      <p className="text-sm text-green-600">Connected</p>
                    ) : (
                      <p className="text-sm text-red-600">Not connected</p>
                    )}
                  </div>
                </div>
                {selectedPlatforms.includes('tiktok') && (
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            <div
              onClick={() => hasYouTube && togglePlatform('youtube')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPlatforms.includes('youtube')
                  ? 'border-purple-600 bg-purple-50'
                  : hasYouTube
                  ? 'border-gray-200 hover:border-purple-300'
                  : 'border-gray-200 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center text-white font-bold">
                    YT
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">YouTube Shorts</h4>
                    {hasYouTube ? (
                      <p className="text-sm text-green-600">Connected</p>
                    ) : (
                      <p className="text-sm text-red-600">Not connected</p>
                    )}
                  </div>
                </div>
                {selectedPlatforms.includes('youtube') && (
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Details */}
        <div className="mb-8 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="viral, story, reddit, tiktok"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="font-semibold mb-2">Video published successfully!</p>
            {success.results?.map((result, index) => (
              <div key={index} className="text-sm">
                {result.success ? (
                  <p>
                    ✓ {result.platform}: <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline">{result.url}</a>
                  </p>
                ) : (
                  <p>✗ {result.platform}: {result.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={loading || selectedPlatforms.length === 0}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Publishing...
            </span>
          ) : (
            'Publish Video'
          )}
        </button>
        </div>
      </div>
    </div>
  );
}

export default PublishVideo;



