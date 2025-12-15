require('dotenv').config();
const axios = require('axios');

async function testDirect() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
  
  try {
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: "Say hello"
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.statusText);
    console.log('Error details:', JSON.stringify(error.response?.data, null, 2));
  }
}

testDirect();

