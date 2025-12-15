const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate Reddit-style story content with title and body
 */
async function generateStory(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const systemPrompt = `You are a Reddit storyteller creating viral AITA, TIFU, relationship, or revenge stories for TikTok/YouTube Shorts.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
TITLE: [A catchy Reddit-style title, 10-15 words max]

[The full story in first person, conversational tone]

RULES:
- Title must be dramatic and hook-worthy (e.g., "My boss fired me for being 2 minutes late, so I exposed his affair to his wife")
- Story should be 200-400 words, perfect for 1-2 minute video
- Write in first person, casual Reddit style
- Include drama, conflict, plot twists, or satisfying revenge
- NO stage directions, NO "(laughs)", NO "[pause]", NO asterisks
- NO emojis in the story text
- Make it feel like a real Reddit post that went viral
- End with a satisfying conclusion or cliffhanger

User request: ${prompt}

Generate the Reddit story now:`;

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
 * Parse Reddit-style story into title and body
 */
function parseRedditStory(storyText) {
  
  const titleMatch = storyText.match(/TITLE:\s*(.+?)(?:\n|$)/i);
  let title = titleMatch ? titleMatch[1].trim() : '';
  
  if (title && !title.match(/[.!?]$/)) {
    title = title + '.';
  }
  
  let body = storyText;
  if (titleMatch) {
    body = storyText.substring(storyText.indexOf(titleMatch[0]) + titleMatch[0].length);
  }
  
  body = body.replace(/\([^)]*\)/g, ''); 
  body = body.replace(/\*/g, ''); 
  body = body.replace(/\s+/g, ' ').trim();
  
  return { title, body };
}

/**
 * Clean voiceover script - title (without TITLE: prefix) + body
 */
function generateVoiceoverScript(storyText) {
  const { title, body } = parseRedditStory(storyText);
  
  if (title) {
    return `${title} ${body}`;
  }
  return body;
}

module.exports = {
  generateStory,
  generateVoiceoverScript,
  parseRedditStory
};
