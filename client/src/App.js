import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ContentGenerator from './components/ContentGenerator';
import VideoCreator from './components/VideoCreator';
import PublishVideo from './components/PublishVideo';
import AccountSettings from './components/AccountSettings';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedContent, setSelectedContent] = useState(null);

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    const savedContent = localStorage.getItem('selectedContent');
    if (savedContent) {
      try {
        setSelectedContent(JSON.parse(savedContent));
      } catch (e) {
        console.error('Error parsing saved content:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedContent) {
      localStorage.setItem('selectedContent', JSON.stringify(selectedContent));
    } else {
      localStorage.removeItem('selectedContent');
    }
  }, [selectedContent]);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedContent');
    localStorage.removeItem('generatedContent');
    setUser(null);
    setCurrentView('dashboard');
    setSelectedContent(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Content Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('generate')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'generate'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Generate
              </button>
              <button
                onClick={() => setCurrentView('accounts')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'accounts'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Accounts
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <Dashboard
            onSelectContent={(content) => {
              setSelectedContent(content);
              if (content.video_url) {
                setCurrentView('publish');
              } else {
                setCurrentView('create-video');
              }
            }}
          />
        )}
        {currentView === 'generate' && (
          <ContentGenerator
            onContentGenerated={(content) => {
              setSelectedContent(content);
              setCurrentView('create-video');
            }}
            savedContent={selectedContent}
          />
        )}
        {currentView === 'create-video' && selectedContent && (
          <VideoCreator
            content={selectedContent}
            onVideoCreated={() => {
              setCurrentView('publish');
            }}
          />
        )}
        {currentView === 'publish' && selectedContent && (
          <PublishVideo
            content={selectedContent}
            onPublished={() => {
              setCurrentView('dashboard');
              setSelectedContent(null);
            }}
          />
        )}
        {currentView === 'accounts' && <AccountSettings />}
      </main>
    </div>
  );
}

export default App;
