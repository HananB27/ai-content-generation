require('dotenv').config();
const axios = require('axios');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  
  try {
    const response = await axios.get(url);
    console.log('✅ Available models:');
    response.data.models.forEach(model => {
      console.log(`- ${model.name} (${model.displayName || 'N/A'})`);
      if (model.supportedGenerationMethods) {
        console.log(`  Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
    });
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.statusText);
    console.log('Error details:', JSON.stringify(error.response?.data, null, 2));
  }
}

listModels();

