const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate story content based on user prompt
 */
async function generateStory(prompt) {
  try {
    // Use gemini-2.5-flash for fast generation, or gemini-2.5-pro for better quality
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const systemPrompt = `You are a creative content writer specializing in engaging, viral-worthy stories for social media platforms like TikTok and YouTube Shorts. 
    Generate a compelling story based on the user's request. The story should be:
    - Engaging and attention-grabbing
    - Appropriate for short-form video content (1-3 minutes when read)
    - Have a clear narrative arc
    - Be suitable for voiceover narration
    - Include natural pauses and dramatic moments
    
    User request: ${prompt}
    
    Generate the story text now:`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Error generating story:', error);
    throw new Error('Failed to generate story');
  }
}

/**
 * Generate voiceover script with timing and pauses
 */
function generateVoiceoverScript(storyText) {
  // Add natural pauses and breaks for better narration
  const script = storyText
    .replace(/\. /g, '. [PAUSE] ')
    .replace(/\! /g, '! [PAUSE] ')
    .replace(/\? /g, '? [PAUSE] ')
    .replace(/\n\n/g, '\n[LONG_PAUSE]\n');
  
  return script;
}

module.exports = {
  generateStory,
  generateVoiceoverScript
};



