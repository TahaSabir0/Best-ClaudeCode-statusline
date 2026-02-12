# GitHub Setup Guide

## 📁 Repository Structure

Your repository is ready with these files:

```
claude-statusline/
├── README.md              # Main documentation
├── EXAMPLES.md           # Usage examples & customization
├── LICENSE               # MIT License
├── .gitignore           # Git ignore rules
├── statusline.js        # Full version (with API usage)
├── statusline-lite.js   # Lite version (faster)
├── install.sh           # Unix/Linux/macOS installer
└── install.ps1          # Windows PowerShell installer
```

## 🚀 Publishing to GitHub

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `claude-statusline` (or your choice)
3. Description: "Enhanced statusline for Claude Code with context & API usage tracking"
4. Choose **Public** (so others can use it)
5. **Do NOT** initialize with README (we have one)
6. Click "Create repository"

### Step 2: Update URLs in Files

Before pushing, replace `YOUR_USERNAME` in these files:

1. **README.md** (lines with GitHub URLs)
2. **statusline.js** (line 3)
3. **statusline-lite.js** (line 3)
4. **install.sh** (line 8)
5. **install.ps1** (line 6)

**Find and replace:**
```bash
cd ~/Desktop/claude-statusline
# Replace YOUR_USERNAME with your actual GitHub username
sed -i 's/YOUR_USERNAME/yourusername/g' README.md statusline.js statusline-lite.js install.sh install.ps1
```

Or manually edit each file.

### Step 3: Initialize Git & Push

```bash
cd ~/Desktop/claude-statusline

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: Claude Code enhanced statusline"

# Add your GitHub repo as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/claude-statusline.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Configure GitHub Repository

1. Go to your repo settings
2. Add topics/tags: `claude-code`, `statusline`, `cli-tool`, `nodejs`
3. Update description
4. Add website (if you have one)

### Step 5: Create a Release (Optional)

1. Go to "Releases" → "Create a new release"
2. Tag version: `v1.0.0`
3. Release title: "Initial Release"
4. Description:
   ```markdown
   ## Features
   - Context usage visualization
   - API usage tracking with 5-hour limits
   - Adaptive timing (fast after first prompt)
   - Smart caching system
   - Lite version for faster performance

   ## Installation
   See README.md for installation instructions.
   ```
5. Click "Publish release"

## 📝 Installation Instructions for Users

Add this to your README or create a separate INSTALL.md:

### Quick Install (Recommended)

**Unix/Linux/macOS:**
```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/claude-statusline/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/YOUR_USERNAME/claude-statusline/main/install.ps1 | iex
```

### Manual Install

See README.md for detailed manual installation steps.

## 🎨 Adding Screenshots

Create screenshots of your statusline in action:

1. **Take screenshots:**
   - Normal usage
   - High context warning
   - With task running
   - Different color states

2. **Add to repo:**
   ```bash
   mkdir screenshots
   # Add your images
   git add screenshots/
   git commit -m "Add screenshots"
   git push
   ```

3. **Update README.md:**
   ```markdown
   ## Preview

   ![Statusline in action](screenshots/demo.png)
   ![High usage warning](screenshots/high-usage.png)
   ```

## 📊 Add Badges

Add badges to README.md for polish:

```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
[![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/claude-statusline)](https://github.com/YOUR_USERNAME/claude-statusline/issues)
[![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/claude-statusline)](https://github.com/YOUR_USERNAME/claude-statusline/stargazers)
```

## 🛠️ Testing Before Release

Test the install script:

```bash
# Create test environment
mkdir -p ~/test-claude/.claude/hooks

# Test the install script
cd ~/Desktop/claude-statusline
./install.sh

# Verify it works
echo '{"model":{"display_name":"Sonnet 4.5"},"workspace":{"current_dir":"/test"},"context_window":{"remaining_percentage":70}}' | node ~/.claude/hooks/statusline.js
```

## 📢 Promoting Your Project

1. **Claude Code Community:**
   - Share in Claude Code discussions
   - Post on relevant Discord/Slack channels
   - Create a demo video

2. **Social Media:**
   - Twitter/X with #ClaudeCode hashtag
   - Reddit r/ClaudeAI or r/commandline
   - Dev.to article

3. **Documentation:**
   - Create a blog post
   - Make a demo video
   - Write a tutorial

## 🔄 Maintenance

### Updating the Repository

```bash
# Make changes
git add .
git commit -m "Description of changes"
git push

# Create new release
# Go to GitHub → Releases → Create new release
# Tag: v1.1.0
```

### Handling Issues

1. Enable GitHub Issues
2. Create issue templates (.github/ISSUE_TEMPLATE/)
3. Respond to bug reports promptly
4. Label issues appropriately

### Pull Requests

1. Review PRs carefully
2. Test changes locally
3. Request changes if needed
4. Merge when ready

## 📄 License

MIT License allows users to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Private use

Just requires:
- Include license and copyright notice

## 🎯 Success Metrics

Track your project's impact:
- GitHub stars
- Downloads (via releases)
- Issues/PRs
- Forks
- Community feedback

## 💡 Future Ideas

Consider adding:
- Configuration file support
- More themes/color schemes
- Plugin system
- Integration with other tools
- Metrics dashboard

---

**Good luck with your open source project! 🚀**

Remember to:
- Keep README updated
- Respond to issues
- Accept good PRs
- Stay active in the community
