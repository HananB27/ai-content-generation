import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function ContentGenerator({ onContentGenerated, savedContent }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    
    const saved = localStorage.getItem('generatedContent');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGeneratedContent(parsed);
        
        if (parsed.approved) {
          setApproved(true);
        }
      } catch (e) {
        console.error('Error parsing saved content:', e);
      }
    } else if (savedContent) {
      
      setGeneratedContent(savedContent);
    }
  }, [savedContent]);

  useEffect(() => {
    if (generatedContent) {
      localStorage.setItem('generatedContent', JSON.stringify({
        ...generatedContent,
        approved: approved
      }));
    }
  }, [generatedContent, approved]);

  const examplePrompts = [
    "Generate me a reddit like story post where a student is trying to get into a large company that his professor owns but hates him",
    "Create a viral TikTok story about a person who discovers their neighbor is a secret millionaire",
    "Write an engaging story about someone who accidentally time travels to the 90s",
  ];

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await api.generateContent(prompt);
      if (result.error) {
        setError(result.error);
      } else {
        setGeneratedContent(result);
        setApproved(false); 
      }
    } catch (err) {
      setError('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (generatedContent) {
      setApproved(true);
      
      const contentToPass = {
        ...generatedContent,
        generatedText: generatedContent.generatedText || generatedContent.generated_text,
        generated_text: generatedContent.generated_text || generatedContent.generatedText,
        approved: true
      };
      
      localStorage.setItem('generatedContent', JSON.stringify(contentToPass));
      onContentGenerated(contentToPass);
    }
  };

  const handleRegenerate = () => {
    setGeneratedContent(null);
    setApproved(false);
    
    localStorage.removeItem('generatedContent');
    
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Generate Content</h2>

        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Describe the story you want to create
            </label>
            <textarea
              id="prompt"
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Generate me a reddit like story post where a student is trying to get into a large company that his professor owns but hates him"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Example prompts:</p>
            <div className="space-y-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Story'
            )}
          </button>
        </form>

        {generatedContent && !approved && (
          <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Preview Generated Story</h3>
                <p className="text-sm text-gray-600 mt-1">Your previously generated content has been restored</p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                Review & Approve
              </span>
            </div>
            
            <div className="bg-white rounded-lg p-6 mb-6 max-h-96 overflow-y-auto border border-purple-200">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                  {generatedContent.generatedText}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-purple-200">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Review the generated story above</p>
                <p>If you like it, click "Approve & Continue" to proceed with video creation</p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-md"
                >
                  Approve & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {approved && generatedContent && (
          <div className="mt-8 p-6 bg-green-50 border-2 border-green-300 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-green-800">Content Approved!</h3>
            </div>
            <p className="text-green-700 mb-4">Your content is ready. Click below to proceed to video creation.</p>
            <button
              onClick={() => onContentGenerated(generatedContent)}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-md"
            >
              Continue to Video Creation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentGenerator;
