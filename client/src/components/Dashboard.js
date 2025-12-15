import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Dashboard({ onSelectContent }) {
  const [content, setContent] = useState([]);
  const [publishedVideos, setPublishedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content'); 

  useEffect(() => {
    loadContent();
    loadPublishedVideos();
  }, []);

  const loadContent = async () => {
    try {
      const data = await api.getMyContent();
      setContent(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPublishedVideos = async () => {
    try {
      const data = await api.getPublishedVideos();
      setPublishedVideos(data);
    } catch (error) {
      console.error('Error loading published videos:', error);
    }
  };

  const handleDeleteTikTokVideo = async (videoId, e) => {
    e.stopPropagation(); 
    
    if (!window.confirm('Are you sure you want to delete this video from TikTok?')) {
      return;
    }

    try {
      await api.deleteTikTokVideo(videoId);
      
      await loadPublishedVideos();
      alert('Video deleted successfully from TikTok');
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">My Content</h2>
        <p className="text-gray-600">Manage your generated content and videos</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'content'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Generated Content
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'published'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Published Videos ({publishedVideos.length})
          </button>
        </nav>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <>
          {content.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No content generated yet</p>
          <p className="text-sm text-gray-400">Start by generating your first story!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectContent(item)}
            >
              <div className="mb-4">
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {item.prompt}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                {item.generated_text}
              </p>
              <div className="text-xs text-gray-400">
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Published Videos Tab */}
      {activeTab === 'published' && (
        <>
          {publishedVideos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">No published videos yet</p>
              <p className="text-sm text-gray-400">Publish your first video to see it here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        video.platform === 'tiktok'
                          ? 'bg-black text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {video.platform === 'tiktok' ? 'TikTok' : 'YouTube'}
                    </span>
                    {video.platform === 'tiktok' && (
                      <button
                        onClick={(e) => handleDeleteTikTokVideo(video.id, e)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                        title="Delete from TikTok"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {video.title || video.prompt}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {video.description || video.generated_text}
                  </p>
                  {video.platform_video_id && (
                    <div className="mb-2">
                      <a
                        href={video.platform === 'tiktok' 
                          ? `https://www.tiktok.com/@${video.username}/video/${video.video_id}`
                          : `https://www.youtube.com/watch?v=${video.video_id}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on {video.platform === 'tiktok' ? 'TikTok' : 'YouTube'} →
                      </a>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Published {new Date(video.published_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
