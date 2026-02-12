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

## Configuration

### Switching Between Versions

Edit `~/.claude/settings.json`:

```json
// Full version (with API usage tracking)
"statusLine": {
  "type": "command",
  "command": "node ~/.claude/hooks/statusline.js"
}

// Lite version (faster, no API calls)
"statusLine": {
  "type": "command",
  "command": "node ~/.claude/hooks/statusline-lite.js"
}
```

### Adjusting Cache TTL

In `statusline.js`, modify line 11:

```javascript
const CACHE_TTL_MS = 30000; // 30 seconds (default)
const CACHE_TTL_MS = 60000; // 60 seconds (slower refresh)
const CACHE_TTL_MS = 10000; // 10 seconds (faster refresh)
```

### Adjusting Timeouts

If you experience lag or missing usage bars, adjust timeouts on line 108:

```javascript
const timeout = hasCache ? 1200 : 1500; // Increase both if needed
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

## Troubleshooting

### Usage bar doesn't show up

1. Check if you're authenticated:
   ```bash
   ls ~/.claude/.credentials.json
   ```

2. Test API access:
   ```bash
   node -e "console.log(require('~/.claude/.credentials.json').claudeAiOauth.accessToken ? 'OK' : 'No token')"
   ```

3. Check logs:
   ```bash
   echo '{}' | node ~/.claude/hooks/statusline.js
   ```

### Statusline is slow

1. Switch to lite version (no API calls)
2. Increase cache TTL to reduce API frequency
3. Check network connectivity

### First prompt lags

This is normal! The first API call takes ~1.5s for OAuth validation and connection setup. Subsequent prompts are faster (~1.2s).

### Colors not showing

Make sure your terminal supports ANSI colors. Most modern terminals do (iTerm2, Windows Terminal, etc.).

## Customization

Want to add custom fields? Edit the `outputStatus()` function:

```javascript
// Add custom field
parts.push(`custom: ${yourData}`);
```

Want different colors? Modify the `colors` object at the top.

## Performance Impact

- **Full version**: ~1.2-1.5s per prompt (API call overhead)
- **Lite version**: ~0.5s per prompt (no API calls)
- **Memory**: Negligible (~5MB per session)
- **Cache**: ~1KB stored in `~/.claude/cache/`

## Uninstall

```bash
# Remove scripts
rm ~/.claude/hooks/statusline.js ~/.claude/hooks/statusline-lite.js

# Remove cache
rm ~/.claude/cache/usage-cache.json

# Revert settings
# Edit ~/.claude/settings.json and remove the "statusLine" section
```

## Contributing

Found a bug or want a feature? Open an issue or PR!

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a PR

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Created by [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

Built for the [Claude Code](https://github.com/anthropics/claude-code) community.

## Support

- 🐛 [Report bugs](https://github.com/YOUR_USERNAME/claude-statusline/issues)
- 💡 [Request features](https://github.com/YOUR_USERNAME/claude-statusline/issues)
- 💬 [Discussions](https://github.com/YOUR_USERNAME/claude-statusline/discussions)

---

**Star ⭐ this repo if you find it useful!**
