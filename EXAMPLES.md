# Examples

## Output Examples

### Full Version
```
my-project │ Sonnet 4.5 │ context: ████░░░░░░ 40% │ usage: ███░░░░░░░ 29% (4h15m)
```

### Lite Version
```
my-project │ Opus 4.6 │ context: ██░░░░░░░░ 20%
```

### With Active Task
```
frontend │ Haiku 4.5 │ context: ████░░░░░░ 35% │ usage: █░░░░░░░░░ 12% (4h52m) │ Running tests
```

### High Context Usage (Red Alert)
```
backend │ Sonnet 4.5 │ context: 💀 █████████░ 95% │ usage: ████░░░░░░ 45% (3h20m)
```

### With GSD Update Available
```
my-app │ Opus 4.6 │ context: ███░░░░░░░ 30% │ usage: ██░░░░░░░░ 18% (4h40m) │ ⬆
```

## Color Examples

### Context Bar Colors

**Green (< 50% used):**
```
context: ███░░░░░░░ 30%  (plenty of room)
```

**Yellow (50-75% used):**
```
context: ██████░░░░ 60%  (getting full)
```

**Orange (75-90% used):**
```
context: ████████░░ 85%  (almost full)
```

**Red + Blinking (> 90% used):**
```
context: 💀 █████████░ 95%  (critically full!)
```

### Usage Bar Colors

Same color scheme applies to the usage bar:
- Green: Under 50%
- Yellow: 50-75%
- Orange: 75-90%
- Red: Over 90%

## Customization Examples

### Custom Fields

Add custom information to your statusline:

```javascript
// Add git branch
const { execSync } = require('child_process');

function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

// In outputStatus function:
const branch = getGitBranch();
if (branch) parts.push(`[${branch}]`);
```

### Custom Colors

Modify the color scheme:

```javascript
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',      // Add blue
  purple: '\x1b[35m',    // Add purple
  cyan: '\x1b[36m',      // Add cyan
  // ... rest of colors
};

// Use custom colors
parts.push(`${colors.cyan}${dirname}${colors.reset}`);
```

### Different Bar Characters

Change the progress bar appearance:

```javascript
// Default
const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);

// Dots
const bar = '●'.repeat(filled) + '○'.repeat(10 - filled);

// Blocks
const bar = '█'.repeat(filled) + '▁'.repeat(10 - filled);

// ASCII
const bar = '#'.repeat(filled) + '-'.repeat(10 - filled);
```

### Shorter Format

Make the statusline more compact:

```javascript
// Instead of: my-project │ Sonnet 4.5 │ context: ████░░░░░░ 40%
// Show:       my-project │ S4.5 │ 40% │ 29%

const modelShort = model.replace('Sonnet ', 'S').replace('Opus ', 'O').replace('Haiku ', 'H');
parts.push(modelShort);
parts.push(`${used}%`);  // Just the number, no bar
```

### Add Timestamp

Show current time in statusline:

```javascript
function getTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

parts.push(getTime()); // e.g., "03:45 PM"
```

### Show Project Type

Detect and show project type:

```javascript
function getProjectType(dir) {
  if (fs.existsSync(path.join(dir, 'package.json'))) return 'node';
  if (fs.existsSync(path.join(dir, 'requirements.txt'))) return 'python';
  if (fs.existsSync(path.join(dir, 'Cargo.toml'))) return 'rust';
  if (fs.existsSync(path.join(dir, 'go.mod'))) return 'go';
  return '';
}

const projectType = getProjectType(dir);
if (projectType) parts.push(`[${projectType}]`);
```

## Platform-Specific Examples

### Windows PowerShell
```powershell
# Test the statusline
echo '{"model":{"display_name":"Sonnet 4.5"}}' | node $env:USERPROFILE\.claude\hooks\statusline.js
```

### macOS/Linux
```bash
# Test the statusline
echo '{"model":{"display_name":"Opus 4.6"}}' | node ~/.claude/hooks/statusline.js
```

## Performance Examples

### Timing Comparison

**Full Version:**
- First prompt: ~1500ms (OAuth + connection setup)
- Subsequent prompts: ~1200ms (cached connection)
- With cache fallback: ~50ms (instant)

**Lite Version:**
- All prompts: ~500ms (no API calls)

### Cache Usage

Check your cache:
```bash
# View cache
cat ~/.claude/cache/usage-cache.json

# Output:
# {"timestamp":1707384567890,"data":"███░░░░░░░ 29% (4h15m)"}
```

## Troubleshooting Examples

### Debug Mode

Add debug logging:

```javascript
const DEBUG_LOG = path.join(CACHE_DIR, 'statusline-debug.log');

function debug(msg) {
  fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] ${msg}\n`);
}

debug('Starting statusline...');
debug(`Has cache: ${hasCache}`);
debug(`API timeout: ${timeout}ms`);
```

### Test API Connection

```bash
# Test if API is reachable
node -e "
const https = require('https');
https.get('https://api.anthropic.com', (res) => {
  console.log('API Status:', res.statusCode);
});
"
```

### Validate Settings

```bash
# Check if settings.json is valid
node -e "console.log(JSON.parse(require('fs').readFileSync(require('os').homedir() + '/.claude/settings.json')))"
```
