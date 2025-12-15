import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function AccountSettings() {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const accounts = await api.getConnectedAccounts();
      setConnectedAccounts(accounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectTikTok = () => {
    
    alert(
      'TikTok OAuth Integration:\n\n' +
      '1. Register your app at https://developers.tiktok.com\n' +
      '2. Get Client Key and Client Secret\n' +
      '3. Implement OAuth flow\n' +
      '4. Call the connect endpoint with tokens'
    );
  };

  const handleConnectYouTube = () => {
    
    alert(
      'YouTube OAuth Integration:\n\n' +
      '1. Create a project in Google Cloud Console\n' +
      '2. Enable YouTube Data API v3\n' +
      '3. Create OAuth 2.0 credentials\n' +
      '4. Implement OAuth flow\n' +
      '5. Call the connect endpoint with tokens'
    );
  };

  const handleDisconnect = async (platform) => {
    if (window.confirm(`Are you sure you want to disconnect your ${platform} account?`)) {
      try {
        await api.disconnectAccount(platform);
        loadAccounts();
      } catch (error) {
        console.error('Error disconnecting account:', error);
        alert('Failed to disconnect account');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const hasTikTok = connectedAccounts.some((acc) => acc.platform === 'tiktok');
  const hasYouTube = connectedAccounts.some((acc) => acc.platform === 'youtube');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h2>
        <p className="text-gray-600 mb-8">Connect your social media accounts to publish videos</p>

        <div className="space-y-6">
          {/* TikTok Connection */}
          <div className="p-6 border-2 border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-black rounded flex items-center justify-center text-white font-bold text-xl">
                  T
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">TikTok</h3>
                  <p className="text-sm text-gray-600">Connect your TikTok account to publish videos</p>
                </div>
              </div>
              {hasTikTok ? (
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    Connected
                  </span>
                  <button
                    onClick={() => handleDisconnect('tiktok')}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectTikTok}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
            {hasTikTok && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Connected as: {connectedAccounts.find((acc) => acc.platform === 'tiktok')?.account_username || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* YouTube Connection */}
          <div className="p-6 border-2 border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-600 rounded flex items-center justify-center text-white font-bold text-xl">
                  YT
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">YouTube</h3>
                  <p className="text-sm text-gray-600">Connect your YouTube account to publish Shorts</p>
                </div>
              </div>
              {hasYouTube ? (
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    Connected
                  </span>
                  <button
                    onClick={() => handleDisconnect('youtube')}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectYouTube}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Connect
                </button>
              )}
            </div>
            {hasYouTube && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Connected as: {connectedAccounts.find((acc) => acc.platform === 'youtube')?.account_username || 'N/A'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> To connect accounts, you'll need to implement OAuth flows for TikTok and YouTube APIs.
            The backend endpoints are ready to receive the access tokens once you complete the OAuth process.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;
