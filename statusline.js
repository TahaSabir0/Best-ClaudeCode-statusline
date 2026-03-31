#!/usr/bin/env node
// Claude Code Enhanced Statusline
// Shows: directory | model | context usage | rate limit usage (5-hour & 7-day) | current task
// Uses native rate_limits data from Claude Code stdin (v2.1.80+)
// https://github.com/TahaSabir0/claude-statusline

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

function getUsageColor(percentage) {
  if (percentage < 50) return colors.green;
  if (percentage < 75) return colors.yellow;
  if (percentage < 90) return colors.orange;
  return colors.red;
}

function getContextBar(remaining) {
  const effectiveRemaining = remaining ?? 100;
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

function getRateLimitBar(rateLimitWindow) {
  if (!rateLimitWindow || rateLimitWindow.used_percentage == null) return null;

  const percentage = Math.round(rateLimitWindow.used_percentage);

  // Build bar
  const barWidth = 10;
  const filledWidth = Math.round((percentage / 100) * barWidth);
  const filled = '\u2588'.repeat(filledWidth);
  const empty = '\u2591'.repeat(barWidth - filledWidth);
  const color = getUsageColor(percentage);

  // Parse reset time
  let timeStr = '';
  if (rateLimitWindow.resets_at) {
    const resetDate = new Date(rateLimitWindow.resets_at * 1000);
    const now = new Date();
    const diffMs = resetDate - now;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      timeStr = `${hours}h${mins}m`;
    } else {
      timeStr = `${mins}m`;
    }
  }

  return `${color}${filled}${empty} ${percentage}%${colors.reset}${timeStr ? `${colors.dim} (${timeStr})${colors.reset}` : ''}`;
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

// Main
function outputStatus(data) {
  try {
    const model = data?.model?.display_name || 'Claude';
    const dir = data?.workspace?.current_dir || process.cwd();
    const dirname = path.basename(dir);
    const sessionId = data?.session_id || '';
    const remaining = data?.context_window?.remaining_percentage;

    const contextBar = getContextBar(remaining);
    const task = getCurrentTask(sessionId);
    const parts = [];
    parts.push(dirname);
    parts.push(model);
    parts.push(`context: ${contextBar}`);

    // Rate limits from native Claude Code data (v2.1.80+)
    const fiveHourBar = getRateLimitBar(data?.rate_limits?.five_hour);
    if (fiveHourBar) {
      parts.push(`5h: ${fiveHourBar}`);
    }

    const sevenDayBar = getRateLimitBar(data?.rate_limits?.seven_day);
    if (sevenDayBar) {
      parts.push(`7d: ${sevenDayBar}`);
    }

    if (task) parts.push(`${colors.dim}${task}${colors.reset}`);
    process.stdout.write(parts.join(' \u2502 '));
  } catch (e) {
    process.stdout.write('Status unavailable');
  }
}

function outputFallback() {
  const contextBar = getContextBar(undefined);
  const parts = ['~', 'Claude', `context: ${contextBar}`];
  process.stdout.write(parts.join(' \u2502 '));
}

// Process stdin
if (process.stdin.isTTY) {
  outputFallback();
  process.exit(0);
} else {
  let input = '';

  const timeout = setTimeout(() => {
    if (input.length > 0) {
      try {
        const data = JSON.parse(input);
        outputStatus(data);
      } catch (e) {
        outputFallback();
      }
    } else {
      outputFallback();
    }
    process.exit(0);
  }, 500);

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
    clearTimeout(timeout);
    try {
      const data = JSON.parse(input);
      outputStatus(data);
    } catch (e) {
      outputFallback();
    }
    process.exit(0);
  });
}
