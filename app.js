require("dotenv").config();
const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

// Validate environment variables
if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is not set in environment variables");
  process.exit(1);
}
if (!SLACK_BOT_TOKEN) {
  console.error("❌ SLACK_BOT_TOKEN is not set in environment variables");
  process.exit(1);
}
if (!SLACK_CHANNEL_ID) {
  console.error("❌ SLACK_CHANNEL_ID is not set in environment variables");
  process.exit(1);
}

// Your fixed prompt
const PROMPT = `Generate a short internal update for the Devfolio team with 3 bullet points: 
1. A highlight from the platform (e.g., top hackathon or product release),
2. A trending news from the dev world,
3. A quirky fact or quote to close the week.`;

// Get response from OpenAI
async function getAIResponse(prompt) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error from OpenAI:", error);
    return null;
  }
}

// Post message to Slack
async function postToSlack(message) {
  try {
    const response = await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: SLACK_CHANNEL_ID,
        text: message,
      },
      {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.ok) {
      console.log("✅ Message posted to Slack successfully");
    } else {
      console.error("❌ Slack API returned an error:", response.data.error);
    }
  } catch (error) {
    if (error.response) {
      console.error(
        "❌ Slack API Error:",
        error.response.status,
        error.response.statusText
      );
      console.error("Error details:", error.response.data);
    } else {
      console.error(
        "❌ Network or other error posting to Slack:",
        error.message
      );
    }
  }
}

// Main runner
(async () => {
  console.log("🤖 Starting Devfolio News Bot...");

  const response = await getAIResponse(PROMPT);
  if (response) {
    console.log("📝 AI response received, posting to Slack...");
    await postToSlack(response);
  } else {
    console.error(
      "❌ Failed to get response from OpenAI. Bot execution stopped."
    );
    process.exit(1);
  }
})();
