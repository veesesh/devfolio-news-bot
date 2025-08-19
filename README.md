# 🤖 The Devfolio Buggle 🕸️

An intelligent Slack bot that automatically generates and posts weekly newsletters for the Devfolio team. The bot fetches messages from multiple Slack channels, processes them using OpenAI's GPT-4, and creates a polished weekly update with structured sections.

## ✨ What It Does

The Devfolio News Bot creates a comprehensive weekly newsletter that includes:

### 📰 Newsletter Sections

- **🚀 Hackathons on the horizon** - Upcoming hackathons with links to devfolio.co/hackathons
- **⚡ Fresh Drops from the Tech Universe** - Latest global tech news from the past week
- **🏡 In-House Updates** - Internal Devfolio updates, product changes, and announcements
- **🌐 Good Read** - Curated tech articles, blog posts, and videos
- **💡 Fun Fact** - A quirky science/tech-related fact
- **🧱 Builder's Check** - Inspirational quote for builders and entrepreneurs

### 🔄 How It Works

1. **Fetches Messages** - Collects messages from the last 7 days from three designated Slack channels
2. **Processes Content** - Uses OpenAI GPT-4 to analyze and structure the content
3. **Generates Newsletter** - Creates a polished weekly update with proper formatting
4. **Posts to Slack** - Automatically sends the newsletter to your designated Slack channel

### 📊 Channel Structure

- **Channel A** (Reading Channel) - Used exclusively for "Good Read" section
- **Channel B** (Random Channel) - Used for tech news and other general sections
- **Channel C** (Social Media Channel) - Used exclusively for "In-House Updates" section

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- Slack Bot Token with appropriate permissions
- Access to Slack channels

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/veesesh/devfolio-news-bot.git
   cd devfolio-news-bot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables in `.env`:

   ```env
   # Slack Configuration
   SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
   SLACK_CHANNEL_ID=C1234567890  # Channel where newsletter will be posted

   # OpenAI Configuration
   OPENAI_API_KEY=sk-proj-your-openai-api-key

   # Source Channels
   SOURCE_CHANNEL_A=C1111111111  # Reading channel (for Good Read section)
   SOURCE_CHANNEL_B=C2222222222  # General channel (for tech news)
   SOURCE_CHANNEL_C=C3333333333  # Social media channel (for in-house updates)

   # Optional
   PORT=3000
   ```

### 🔧 Configuration Setup

#### 1. Slack Bot Setup

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app for your workspace
3. Add the following OAuth scopes:
   - `chat:write` - To post messages
   - `channels:history` - To read channel messages
   - `channels:read` - To access channel information
4. Install the app to your workspace
5. Copy the Bot User OAuth Token (starts with `xoxb-`)

#### 2. OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the API key (starts with `sk-`)

#### 3. Channel IDs Setup

1. In Slack, right-click on each channel you want to use
2. Select "Copy link"
3. Extract the channel ID from the URL (e.g., `C1234567890`)

### 🏃‍♂️ Running Locally

#### Manual Run

```bash
node index.js
```

#### Development Mode

You can also add scripts to your `package.json`:

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

Then run:

```bash
npm start
```

---

**Never stop building!** 🚀
