# Claude Code Enhanced Statusline

A customizable, feature-rich statusline for [Claude Code](https://github.com/anthropics/claude-code) that displays real-time information about your coding session.

## Features

### 🎯 Full Version (`statusline.js`)

- **Context Usage**: Visual bar showing token usage (green → yellow → orange → red)
- **API Usage**: Real-time 5-hour session limit tracking with countdown timer
- **Current Directory**: Shows your working directory
- **Model Name**: Displays which Claude model you're using (Opus, Sonnet, Haiku)
- **Current Task**: Shows active task from task list (if using GSD or tasks)
- **Update Notifications**: Alerts for GSD updates
- **Adaptive Performance**: Fast after first prompt (1.2s vs 1.5s)
- **Smart Caching**: Shares usage data across sessions, fallback on API timeout

### ⚡ Lite Version (`statusline-lite.js`)

- Same features as full version **except** API usage tracking
- Faster response time (~500ms)
- No external API calls
- Perfect if you don't need usage limits tracking

## Preview

```
my-project │ Sonnet 4.5 │ context: ████░░░░░░ 40% │ usage: ███░░░░░░░ 29% (4h15m)
```

**Color Coding:**

- 🟢 Green: < 50% usage
- 🟡 Yellow: 50-75% usage
- 🟠 Orange: 75-90% usage
- 🔴 Red (blinking): > 90% usage

## Requirements

- [Claude Code](https://github.com/anthropics/claude-code) installed
- Node.js (comes with Claude Code)
- Authenticated Claude account (for API usage tracking in full version)

## Installation

### Option 1: Quick Install (Recommended)

```bash
# Download and install
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/claude-statusline/main/install.sh | bash
```

### Option 2: Manual Install

1. **Download the script:**

   ```bash
   # For full version with API usage
   curl -o ~/.claude/hooks/statusline.js https://raw.githubusercontent.com/YOUR_USERNAME/claude-statusline/main/statusline.js

   # OR for lite version (faster, no API calls)
   curl -o ~/.claude/hooks/statusline-lite.js https://raw.githubusercontent.com/YOUR_USERNAME/claude-statusline/main/statusline-lite.js
   ```

2. **Make it executable:**

   ```bash
   chmod +x ~/.claude/hooks/statusline.js
   # or
   chmod +x ~/.claude/hooks/statusline-lite.js
   ```

3. **Update Claude Code settings:**

   Edit `~/.claude/settings.json` and add/modify the `statusLine` section:

   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "node ~/.claude/hooks/statusline.js"
     }
   }
   ```

   For lite version, use `statusline-lite.js` instead.

4. **Restart Claude Code** or start a new session.

### Option 3: Clone & Install

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/claude-statusline.git
cd claude-statusline

# Run installer
./install.sh
```

## How It Works

### Adaptive Timing

- **First prompt**: Uses 1500ms timeout (cold start, OAuth validation)
- **Subsequent prompts**: Uses 1200ms timeout (faster, connection reused)
- **Result**: Smooth experience after initial setup

### Caching System

- Usage data is cached for 30 seconds in `~/.claude/cache/usage-cache.json`
- All sessions share the same cache
- If API call times out, shows cached data (no lag)

### API Usage

- Fetches from `https://api.anthropic.com/api/oauth/usage`
- Tracks 5-hour session limits
- Shows percentage used + time until reset
- Fails gracefully (no statusline breakage)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Created by [@TahaSabir0](https://github.com/TahaSabir0)

Built for the [Claude Code](https://github.com/anthropics/claude-code) community.

---

**Star ⭐ this repo if you find it useful!**
