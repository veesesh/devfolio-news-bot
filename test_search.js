//chanel_a = reading
//chanel_b = random
//chanel_c = social media
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

// Test the Google GenAI with search functionality
async function testSearchCapability() {
  try {
    console.log("🧪 Testing Google GenAI with search grounding...");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const groundingTool = {
      googleSearch: {},
    };
    const config = {
      tools: [groundingTool],
    };

    // Make the request

    const testPrompt =
      "What are the top 2 tech news stories from this week? Include links to credible sources. Please ADD LINKS IN THE RESPONSE";

    // const result = await model.generateContent(testPrompt);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: testPrompt,
      config,
    });
    //const response = await result.response;

    console.log("✅ Search-enabled response received:");
    console.log(response.text);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testSearchCapability();
