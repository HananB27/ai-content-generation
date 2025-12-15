import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9999/api';

const BACKGROUND_VIDEOS = [
  { id: 'subway_surfers_QPW3XwBoQlw', name: 'Subway Surfers #1', description: 'Classic gameplay', thumb: `${API_URL}/media/static/youtube/subway_surfers/thumb_QPW3XwBoQlw.jpg` },
  { id: 'subway_surfers_i0M4ARe9v0Y', name: 'Subway Surfers #2', description: 'Long run gameplay', thumb: `${API_URL}/media/static/youtube/subway_surfers/thumb_i0M4ARe9v0Y.jpg` },
  { id: 'subway_surfers_tiktok_7453104964236266774', name: 'Subway Surfers #3', description: 'TikTok clip', thumb: `${API_URL}/media/static/youtube/subway_surfers/thumb_tiktok.jpg` },
];

function VideoCreator({ content, onVideoCreated }) {
  
  useEffect(() => {
    if (content) {
      localStorage.setItem('selectedContent', JSON.stringify(content));
    }
  }, [content]);
  const [backgroundMusic, setBackgroundMusic] = useState('');
  const [backgroundVideo, setBackgroundVideo] = useState(BACKGROUND_VIDEOS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ message: '', percent: 0 });
  const progressIntervalRef = useRef(null);
  
  const [tiktokSounds, setTiktokSounds] = useState([]);
  const [loadingSounds, setLoadingSounds] = useState(true);
  const [playingSound, setPlayingSound] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const audioRefs = useRef({});
  
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [editedStory, setEditedStory] = useState('');
  
  useEffect(() => {
    if (content) {
      const storyText = content.generatedText || content.generated_text || '';
      setEditedStory(storyText);
    }
  }, [content]);

  useEffect(() => {
    const loadTrendingSounds = async () => {
      try {
        setLoadingSounds(true);
        const response = await api.getTrendingSounds(20);
        if (response.success && response.data) {
          setTiktokSounds(response.data);
        } else {
          console.error('Failed to load TikTok sounds:', response);
        }
      } catch (err) {
        console.error('Error loading TikTok sounds:', err);
        setError('Failed to load TikTok sounds. Using fallback options.');
        
        setTiktokSounds([
          { id: 'chill', title: 'Chill Vibes', author: 'Default', duration: 30, cover_url: null, play_url: null },
          { id: 'upbeat', title: 'Upbeat Energy', author: 'Default', duration: 30, cover_url: null, play_url: null },
        ]);
      } finally {
        setLoadingSounds(false);
      }
    };
    loadTrendingSounds();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  const handleSoundPreview = (sound) => {
    
    if (playingSound && audioRefs.current[playingSound]) {
      audioRefs.current[playingSound].pause();
      audioRefs.current[playingSound].currentTime = 0;
    }

    if (playingSound === sound.id) {
      setPlayingSound(null);
      return;
    }

    if (sound.play_url) {
      const audio = new Audio(sound.play_url);
      audio.volume = 0.5; 
      audioRefs.current[sound.id] = audio;
      
      audio.addEventListener('error', (err) => {
        console.error('Audio playback error:', err);
        setError('Could not play sound preview. The audio may be blocked by CORS or unavailable.');
        setPlayingSound(null);
      });
      
      audio.addEventListener('canplaythrough', () => {
        
        audio.play().catch(err => {
          console.error('Error playing sound:', err);
          setError('Could not play sound preview. Please try again.');
          setPlayingSound(null);
        });
      });
      
      audio.addEventListener('ended', () => {
        setPlayingSound(null);
      });
      
      audio.load();
      setPlayingSound(sound.id);
    } else {
      
      setError('Preview not available for this sound. TikTok API may not provide preview URLs in sandbox mode. You can still select this sound.');
      setTimeout(() => setError(''), 3000); 
    }
  };

  const handleSearchSounds = async () => {
    if (!searchQuery.trim()) {
      
      try {
        setLoadingSounds(true);
        const response = await api.getTrendingSounds(20);
        if (response.success && response.data) {
          setTiktokSounds(response.data);
        }
      } catch (err) {
        console.error('Error loading sounds:', err);
      } finally {
        setLoadingSounds(false);
      }
      return;
    }

    try {
      setLoadingSounds(true);
      const response = await api.searchTikTokSounds(searchQuery, 20);
      if (response.success && response.data) {
        setTiktokSounds(response.data);
      }
    } catch (err) {
      console.error('Error searching sounds:', err);
      setError('Failed to search sounds. Please try again.');
    } finally {
      setLoadingSounds(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!backgroundMusic) {
      setError('Please select background music');
      return;
    }

    setError('');
    setLoading(true);
    setProgress({ message: 'Starting video creation...', percent: 0 });

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    try {
      
      if (editedStory && editedStory !== (content.generatedText || content.generated_text)) {
        try {
          await api.updateContent(content.id, { generated_text: editedStory });
          
          content.generatedText = editedStory;
          content.generated_text = editedStory;
        } catch (err) {
          console.error('Error updating story:', err);
          
        }
      }
      
      await api.createVideo(content.id, backgroundMusic, backgroundVideo);
      
      const pollProgress = async () => {
        try {
          const progressData = await api.getVideoProgress(content.id);
          setProgress({
            message: progressData.message || 'Processing...',
            percent: progressData.percent !== null && progressData.percent !== undefined ? progressData.percent : 0
          });

          if (progressData.message && progressData.message.toLowerCase().includes('error')) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            setError(progressData.message);
            setLoading(false);
            return;
          }

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
          console.error('Error polling progress:', err);
        }
      };
      
      pollProgress();
      progressIntervalRef.current = setInterval(pollProgress, 500); 

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

        {/* Generated Story Preview - Editable */}
        <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Your Story</h3>
            <button
              onClick={() => setIsEditingStory(!isEditingStory)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              {isEditingStory ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Done Editing
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Story
                </>
              )}
            </button>
          </div>
          {isEditingStory ? (
            <textarea
              value={editedStory}
              onChange={(e) => setEditedStory(e.target.value)}
              className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-700 min-h-[150px]"
              placeholder="Enter your story..."
            />
          ) : (
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{editedStory || content.generatedText || content.generated_text || 'No story available'}</p>
          )}
        </div>

        {/* Background Music Selection - TikTok Sounds */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Select Background Music</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search sounds..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSounds()}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSearchSounds}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                Search
              </button>
            </div>
          </div>

          {loadingSounds ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 text-gray-600">Loading trending sounds...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiktokSounds.length > 0 ? (
                tiktokSounds.map((sound) => (
                  <div
                    key={sound.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      backgroundMusic === sound.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{sound.title || 'Untitled'}</h4>
                        <p className="text-xs text-gray-500 mb-2">by {sound.author || 'Unknown'}</p>
                        {sound.duration && (
                          <p className="text-xs text-gray-400">{Math.round(sound.duration)}s</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Play/Pause Button - Always clickable */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSoundPreview(sound);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            sound.play_url 
                              ? playingSound === sound.id
                                ? 'bg-purple-200 hover:bg-purple-300'
                                : 'bg-purple-100 hover:bg-purple-200'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          title={
                            sound.play_url
                              ? playingSound === sound.id 
                                ? 'Stop preview' 
                                : 'Preview sound'
                              : 'Click to try preview (may not be available)'
                          }
                        >
                          {sound.play_url && playingSound === sound.id ? (
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className={`w-4 h-4 ${sound.play_url ? 'text-purple-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        {/* Selection Checkmark */}
                        {backgroundMusic === sound.id && (
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {/* Cover Image if available */}
                    {sound.cover_url && (
                      <div className="mt-2 rounded overflow-hidden bg-gray-100">
                        <img 
                          src={sound.cover_url} 
                          alt={sound.title}
                          className="w-full h-24 object-cover"
                          onError={(e) => {
                            
                            e.target.style.display = 'none';
                            
                            const parent = e.target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-24 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center"><svg class="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" /></svg></div>';
                            }
                          }}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => setBackgroundMusic(sound.id)}
                      className="mt-3 w-full text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      {backgroundMusic === sound.id ? 'Selected' : 'Select this sound'}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No sounds found. Try a different search term.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Background Video Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Background Video</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BACKGROUND_VIDEOS.map((video) => (
              <div 
                key={video.id}
                onClick={() => setBackgroundVideo(video.id)}
                className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                  backgroundVideo === video.id 
                    ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-300' 
                    : 'border-gray-200 hover:border-purple-400'
                }`}
              >
                <div className="relative w-full h-32 bg-black">
                  {video.thumb ? (
                    <img
                      src={video.thumb}
                      alt={video.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                      <span className="text-white text-4xl">🎮</span>
                    </div>
                  )}
                  {backgroundVideo === video.id && (
                    <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-gray-900 text-sm">{video.name}</h4>
                  <p className="text-xs text-gray-500">{video.description}</p>
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
          disabled={loading || !backgroundMusic}
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
