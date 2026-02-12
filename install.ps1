# Claude Code Enhanced Statusline - Windows PowerShell Installation Script

$ErrorActionPreference = "Stop"

$HOOKS_DIR = "$env:USERPROFILE\.claude\hooks"
$SETTINGS_FILE = "$env:USERPROFILE\.claude\settings.json"
$REPO_URL = "https://raw.githubusercontent.com/YOUR_USERNAME/claude-statusline/main"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Claude Code Statusline Installer" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Claude Code is installed
if (-not (Test-Path "$env:USERPROFILE\.claude")) {
    Write-Host "Error: Claude Code not found!" -ForegroundColor Red
    Write-Host "Please install Claude Code first: https://github.com/anthropics/claude-code"
    exit 1
}

# Create hooks directory if it doesn't exist
New-Item -ItemType Directory -Force -Path $HOOKS_DIR | Out-Null

# Prompt user for version choice
Write-Host "Which version would you like to install?"
Write-Host "  1) Full version (with API usage tracking)"
Write-Host "  2) Lite version (faster, no API calls)"
Write-Host ""
$choice = Read-Host "Enter your choice (1 or 2)"

switch ($choice) {
    "1" {
        $SCRIPT_NAME = "statusline.js"
        $VERSION_NAME = "Full version"
    }
    "2" {
        $SCRIPT_NAME = "statusline-lite.js"
        $VERSION_NAME = "Lite version"
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Download the script
Write-Host ""
Write-Host "Downloading $VERSION_NAME..." -ForegroundColor Yellow

try {
    $url = "$REPO_URL/$SCRIPT_NAME"
    $output = "$HOOKS_DIR\$SCRIPT_NAME"
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host "✓ Downloaded and installed $SCRIPT_NAME" -ForegroundColor Green
} catch {
    Write-Host "Error downloading script: $_" -ForegroundColor Red
    exit 1
}

# Update settings.json
Write-Host ""
Write-Host "Updating Claude Code settings..." -ForegroundColor Yellow

# Backup existing settings
if (Test-Path $SETTINGS_FILE) {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    Copy-Item $SETTINGS_FILE "$SETTINGS_FILE.backup.$timestamp"
    Write-Host "✓ Backed up existing settings" -ForegroundColor Green
}

# Read or create settings
$settings = @{}
if (Test-Path $SETTINGS_FILE) {
    try {
        $settings = Get-Content $SETTINGS_FILE | ConvertFrom-Json -AsHashtable
    } catch {
        # If parsing fails, start with empty settings
        $settings = @{}
    }
}

# Update statusLine setting (use forward slashes for cross-platform compatibility)
$commandPath = "$HOOKS_DIR\$SCRIPT_NAME" -replace '\\', '/'
$settings.statusLine = @{
    type = "command"
    command = "node $commandPath"
}

# Write back to file
$settings | ConvertTo-Json -Depth 10 | Set-Content $SETTINGS_FILE
Write-Host "✓ Updated settings.json" -ForegroundColor Green

# Success message
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Installation Complete! ✓" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Restart Claude Code or start a new session"
Write-Host "  2. Your statusline should now be active!"
Write-Host ""
Write-Host "To switch versions:"
Write-Host "  - Run this installer again, or"
Write-Host "  - Edit ~/.claude/settings.json manually"
Write-Host ""
Write-Host "To uninstall:"
Write-Host "  - Remove ~/.claude/hooks/$SCRIPT_NAME"
Write-Host "  - Remove the 'statusLine' section from ~/.claude/settings.json"
Write-Host ""
Write-Host "For help, visit: https://github.com/YOUR_USERNAME/claude-statusline"
Write-Host ""
