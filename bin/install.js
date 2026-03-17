#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const claudeDir = path.join(os.homedir(), '.claude');
const hooksDir = path.join(claudeDir, 'hooks');
const settingsFile = path.join(claudeDir, 'settings.json');
const scriptDest = path.join(hooksDir, 'statusline.js');
const scriptSrc = path.join(__dirname, '..', 'statusline.js');

const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

console.log(`${cyan}======================================${reset}`);
console.log(`${cyan}  Claude Code Statusline Installer${reset}`);
console.log(`${cyan}======================================${reset}\n`);

// Check Claude Code is installed
if (!fs.existsSync(claudeDir)) {
  console.log(`${red}Error: Claude Code not found!${reset}`);
  console.log('Please install Claude Code first: https://github.com/anthropics/claude-code');
  process.exit(1);
}

// Create hooks directory
if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

// Copy statusline script
console.log(`${yellow}Installing statusline...${reset}`);
fs.copyFileSync(scriptSrc, scriptDest);
fs.chmodSync(scriptDest, 0o755);
console.log(`${green}✓ Installed statusline.js${reset}`);

// Update settings.json
console.log(`${yellow}Updating settings...${reset}`);

let settings = {};
if (fs.existsSync(settingsFile)) {
  // Backup existing settings
  const backup = `${settingsFile}.backup.${Date.now()}`;
  fs.copyFileSync(settingsFile, backup);
  console.log(`${green}✓ Backed up existing settings${reset}`);

  try {
    settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  } catch (e) {
    settings = {};
  }
}

settings.statusLine = {
  type: 'command',
  command: `node ${scriptDest.replace(/\\/g, '/')}`
};

fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
console.log(`${green}✓ Updated settings.json${reset}`);

console.log(`\n${green}======================================${reset}`);
console.log(`${green}  Installation Complete!${reset}`);
console.log(`${green}======================================${reset}`);
console.log('\nRestart Claude Code or start a new session.');
console.log('The statusline will auto-detect your setup (subscription vs API key).\n');
