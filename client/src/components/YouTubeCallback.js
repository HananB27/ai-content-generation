import React, { useEffect, useState } from 'react';
import { handleYouTubeCallback } from '../utils/youtubeOAuth';

function YouTubeCallback() {
  const [status, setStatus] = useState('Processing your request...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const connectYouTubeAccount = async () => {
      try {
        // Get the code from URL query parameters
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code provided');
        }
        
        setStatus('Connecting your YouTube account...');
        const result = await handleYouTubeCallback(code);
        
        setStatus(`Success! ${result.message || 'YouTube account connected'}`);
      } catch (err) {
        console.error('YouTube connection error:', err);
        setStatus('Failed to connect YouTube account');
        setError(err.message || 'Unknown error occurred');
        
        // Redirect after longer delay on error
        setTimeout(() => {
          navigate('/account-settings');
        }, 5000);
      }
    };
    
    connectYouTubeAccount();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {error ? (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : status.includes('Success') ? (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 flex items-center justify-center mx-auto">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status.includes('Success') ? 'Connected!' : error ? 'Connection Failed' : 'Connecting...'}
        </h2>
        
        <p className="text-gray-600 mb-6">{status}</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <button
          onClick={() => navigate('/account-settings')}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Return to Account Settings
        </button>
      </div>
    </div>
  );
}

export default YouTubeCallback;
