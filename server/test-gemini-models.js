const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
  try {
    // Try different model names
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'models/gemini-pro',
      'models/gemini-1.5-pro'
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`\nTrying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ SUCCESS with ${modelName}!`);
        console.log(`Response: ${text.substring(0, 50)}...`);
        console.log(`\n✅ Use this model name: ${modelName}`);
        process.exit(0);
      } catch (error) {
        console.log(`❌ Failed: ${error.message.substring(0, 100)}`);
      }
    }
    
    console.log('\n❌ None of the models worked. Check your API key and API enablement.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testModels();

