# Git Backup Automation Script
# Automatically commits and pushes changes to GitHub

param(
    [string]$Message = "Auto-backup: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    [switch]$Force
)

Write-Host "🔄 Starting Git Backup..." -ForegroundColor Cyan

# Change to project directory
Set-Location "D:\SPD"

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git repository not found. Initializing..." -ForegroundColor Red
    git init
    git remote add origin https://github.com/fayaz1010/spd.git
}

# Check for changes
$status = git status --porcelain
if (-not $status -and -not $Force) {
    Write-Host "✅ No changes to backup" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Changes detected:" -ForegroundColor Yellow
git status --short

# Add all changes
Write-Host "`n📦 Adding files..." -ForegroundColor Cyan
git add .

# Commit changes
Write-Host "💾 Committing changes..." -ForegroundColor Cyan
git commit -m $Message

# Push to remote
Write-Host "☁️ Pushing to GitHub..." -ForegroundColor Cyan
try {
    git push origin main
    Write-Host "`n✅ Backup completed successfully!" -ForegroundColor Green
    Write-Host "📊 Commit: $Message" -ForegroundColor Gray
} catch {
    Write-Host "`n❌ Push failed. Trying to pull first..." -ForegroundColor Red
    git pull origin main --rebase
    git push origin main
    Write-Host "✅ Backup completed after rebase!" -ForegroundColor Green
}

# Show latest commits
Write-Host "`n📜 Latest commits:" -ForegroundColor Cyan
git log --oneline -5

Write-Host "`n✨ Backup complete!" -ForegroundColor Green
