import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function Dashboard({ onSelectContent }) {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
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
    </div>
  );
}

export default Dashboard;



