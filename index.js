require("dotenv").config();
const axios = require("axios");

// ENV vars
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SOURCE_CHANNEL_A = process.env.SOURCE_CHANNEL_A;
const SOURCE_CHANNEL_B = process.env.SOURCE_CHANNEL_B;

// Validate environment variables
[
    ["GEMINI_API_KEY", GEMINI_API_KEY],
    ["SLACK_BOT_TOKEN", SLACK_BOT_TOKEN],
    ["SLACK_CHANNEL_ID", SLACK_CHANNEL_ID],
    ["SOURCE_CHANNEL_A", SOURCE_CHANNEL_A],
    ["SOURCE_CHANNEL_B", SOURCE_CHANNEL_B],
].forEach(([name, value]) => {
    if (!value) {
        console.error(`❌ ${name} is not set in environment variables`);
        process.exit(1);
    }
});

const currentWeek = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
});

// Clean, paraphrasing prompt
const PROMPT = `
You are the editor of "Devfolio News" — a weekly broadcast to share Devfolio's key updates, product changes, and community highlights.

📝 Your job: Rewrite the provided Slack updates into a polished weekly newsletter with exactly the following sections in order. Avoid broken formatting like doubled or single asterisks or missing spaces.

---

🗞️ Devfolio News - Week of ${currentWeek}

🚀 Hackathons on the horizon (Can paraphrase this line):
- Mention upcoming hackathons on Devfolio with enthusiasm.
- ALWAYS include this link exactly as-is: https://devfolio.co/hackathons
- The sentence before and after the link must be rewritten every time to sound fresh while keeping the meaning.
- Keep it to 2–3 sentences max.

⚡ Fresh Drops from the Tech Universe:
- Summarize 2–3 of the most important global tech news stories from the last 7 days.
- Search the context in the slack messages if not found, pull fresh.
- Each item must be in the format: Headline – short one-sentence summary (mention the date of the update in parentheses) – [direct link to the most relevant and recent article].
- Only include links that match the news and are from credible sources.
- Separate each story with a blank line.
- Do NOT repeat the same link twice.

🏡 In-House Updates:
- Summarize internal Devfolio updates, product changes, or announcements or EDC updates from the provided Slack messages from the general channel.
- Each update: 1–2 sentences.
- If none found, leave section blank.

🌐 Good Read:
- ONLY use content from the source_channel_A (reading channel) for this section.
- If source_channel_A has messages from the last 7 days, use those to recommend 1–3 interesting tech-related articles, blog posts, or videos.
- If source_channel_A has no recent messages, generate fresh recommendations for interesting tech-related articles, blog posts, or videos from the last week.
- Include a short hook before each link.
- Do NOT use source_channel_A content in any other section.

💡 Fun Fact:
- Share one short, quirky, verified fact (preferably science/tech-related).
- Keep it one sentence.

🧱 Builder's Check:
- End with a short inspirational quote for builders or entrepreneurs.

End the newsletter with sentence "Never stop building!"

📌 Rules:
- Use the provided Slack messages as your primary source, but separate them by channel purpose.
- Source_channel_A (reading channel) content is ONLY for the "Good Read" section.
- All other sections should use content from the general channel or generate fresh content if needed.
- If some sections are missing info, supplement with relevant, recent public info (last 7 days).
- Make sure to pull out the actual link related to the respective news from the context. 
- Keep tone friendly and concise.
- Maintain consistent formatting across all sections — no bullet symbols unless part of a section style.
- No repeated articles or links in multiple sections.
- Do not use asterisks.  
- Do not repeat any subtopic anywhere and do not repeat links in multiple sections.

---

Here's the recent Slack context:
`;

// Helper to clean Slack formatting
function cleanSlackFormatting(text) {
    if (!text) return "";
    return text
        .replace(/<([^|>]+)\|([^>]+)>/g, "$2 ($1)")
        .replace(/<([^>]+)>/g, "$1");
}

// Fetch messages from last 7 days from a Slack channel
async function fetchChannelMessages(channelId) {
    try {
        // Calculate timestamp for 7 days ago
        const sevenDaysAgo = Math.floor(
            (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000
        );

        const res = await axios.get("https://slack.com/api/conversations.history", {
            params: {
                channel: channelId,
                oldest: sevenDaysAgo,
            },
            headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
        });

        if (!res.data.ok) {
            console.error(
                `❌ Failed to fetch messages from ${channelId}: ${res.data.error}`
            );
            return [];
        }
        return res.data.messages || [];
    } catch (err) {
        console.error(`❌ Error fetching messages for ${channelId}:`, err.message);
        return [];
    }
}

// Extract readable content from messages
function extractMessageContent(messages) {
    let combined = "";
    messages.forEach((msg, i) => {
        if (msg.text) {
            combined += `\nMessage ${i + 1}: ${cleanSlackFormatting(msg.text)}`;
        }

        if (msg.attachments) {
            msg.attachments.forEach((att) => {
                if (att.title)
                    combined += `\nAttachment: ${cleanSlackFormatting(att.title)}`;
                if (att.text)
                    combined += `\nAttachment text: ${cleanSlackFormatting(att.text)}`;
                if (att.title_link) combined += `\nLink: ${att.title_link}`;
            });
        }

        if (msg.blocks) {
            msg.blocks.forEach((block) => {
                if (block.type === "section" && block.text && block.text.text) {
                    combined += `\nBlock text: ${cleanSlackFormatting(block.text.text)}`;
                }
            });
        }
    });
    return combined.trim();
}

// Get separate context from channels with specific purposes
async function getContextFromChannels(channelAId, channelBId) {
    const [messagesA, messagesB] = await Promise.all([
        fetchChannelMessages(channelAId),
        fetchChannelMessages(channelBId),
    ]);

    const contentA = extractMessageContent(messagesA);
    const contentB = extractMessageContent(messagesB);

    // Check if channel A (reading channel) has any content
    const hasChannelAContent = messagesA.length > 0 && contentA.trim().length > 0;

    let contextString = "";

    if (hasChannelAContent) {
        contextString += `--- SOURCE_CHANNEL_A (Reading Channel - For Good Read Section Only) ---\n${contentA}\n\n`;
    } else {
        contextString += `--- SOURCE_CHANNEL_A (Reading Channel) ---\nNo messages found in the last 7 days. Generate fresh content for Good Read section.\n\n`;
    }

    contextString += `--- GENERAL_CHANNEL (For All Other Sections) ---\n${contentB}`;

    return contextString;
}

// Get response from Gemini
async function getAIResponse(prompt) {
    try {
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                contents: [{ parts: [{ text: prompt }] }],
            }, { headers: { "Content-Type": "application/json" } }
        );
        return res.data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        if (error.response) {
            console.error(
                "❌ Gemini API Error:",
                error.response.status,
                error.response.statusText
            );
            console.error("Error details:", error.response.data);
        } else {
            console.error("❌ Network or other error:", error.message);
        }
        return null;
    }
}

// Post message to Slack
async function postToSlack(message) {
    try {
        const response = await axios.post(
            "https://slack.com/api/chat.postMessage", { channel: SLACK_CHANNEL_ID, text: message }, {
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
(async() => {
    console.log("🤖 Starting Devfolio News Bot...");

    // Step 1: Get messages from last 7 days from both source channels
    const context = await getContextFromChannels(
        SOURCE_CHANNEL_A,
        SOURCE_CHANNEL_B
    );

    // Step 2: Append context to prompt
    const fullPrompt = `${PROMPT}\n${context}`;

    // Step 3: Get AI-generated update
    const response = await getAIResponse(fullPrompt);

    // Step 4: Post to Slack
    if (response) {
        console.log("📝 AI response received, posting to Slack...");
        await postToSlack(response);
    } else {
        console.error(
            "❌ Failed to get response from Gemini. Bot execution stopped."
        );
        process.exit(1);
    }
})();