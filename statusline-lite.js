#!/usr/bin/env node
// Claude Code Lite Statusline (No API usage tracking - faster)
// Shows: directory | model | context usage | current task
// https://github.com/YOUR_USERNAME/claude-statusline

const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  orange: '\x1b[38;5;208m',
  red: '\x1b[31m',
  blink: '\x1b[5m'
};

function getContextBar(remaining) {
  const effectiveRemaining = remaining ?? 89;
  const used = Math.max(0, Math.min(100, 100 - Math.round(effectiveRemaining)));

  const filled = Math.floor(used / 10);
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);

  let coloredBar;
  if (used < 50) {
    coloredBar = `${colors.green}${bar} ${used}%${colors.reset}`;
  } else if (used < 65) {
    coloredBar = `${colors.yellow}${bar} ${used}%${colors.reset}`;
  } else if (used < 80) {
    coloredBar = `${colors.orange}${bar} ${used}%${colors.reset}`;
  } else {
    coloredBar = `${colors.blink}${colors.red}\u{1F480} ${bar} ${used}%${colors.reset}`;
  }

  return coloredBar;
}

function getCurrentTask(sessionId) {
  if (!sessionId) return '';

  const homeDir = os.homedir();
  const todosDir = path.join(homeDir, '.claude', 'todos');

  if (!fs.existsSync(todosDir)) return '';

  try {
    const files = fs.readdirSync(todosDir)
      .filter(f => f.startsWith(sessionId) && f.includes('-agent-') && f.endsWith('.json'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > 0) {
      const todos = JSON.parse(fs.readFileSync(path.join(todosDir, files[0].name), 'utf8'));
      const inProgress = todos.find(t => t.status === 'in_progress');
      if (inProgress) return inProgress.activeForm || '';
    }
  } catch (e) {}

  return '';
}

function getGsdUpdate() {
  const homeDir = os.homedir();
  const cacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-update-check.json');

  if (!fs.existsSync(cacheFile)) return '';

  try {
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    if (cache.update_available) {
      return `${colors.yellow}\u2B06${colors.reset} `;
    }
  } catch (e) {}

  return '';
}

// Main
function outputFallback() {
  const contextBar = getContextBar(undefined);
  process.stdout.write(`~ \u2502 Claude \u2502 context: ${contextBar}`);
}

function processInput(input) {
  try {
    const data = JSON.parse(input);
    const model = data.model?.display_name || 'Claude';
    const dir = data.workspace?.current_dir || process.cwd();
    const dirname = path.basename(dir);
    const sessionId = data.session_id || '';
    const remaining = data.context_window?.remaining_percentage;

    const contextBar = getContextBar(remaining);
    const task = getCurrentTask(sessionId);
    const gsdUpdate = getGsdUpdate();

    const parts = [];
    parts.push(dirname);
    parts.push(model);
    parts.push(`context: ${contextBar}`);
    if (task) parts.push(`${colors.dim}${task}${colors.reset}`);
    if (gsdUpdate) parts.push(gsdUpdate);

    process.stdout.write(parts.join(' \u2502 '));
  } catch (e) {
    process.stdout.write('Status unavailable');
  }
}

if (process.stdin.isTTY) {
  outputFallback();
  process.exit(0);
}

const timeout = setTimeout(() => {
  if (input.length > 0) {
    processInput(input);
  } else {
    outputFallback();
  }
  process.exit(0);
}, 500); // Fast timeout since no API calls

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(timeout);
  processInput(input);
});
