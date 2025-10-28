Write-Host "Switching from v1 to v2..." -ForegroundColor Cyan

# Create backup directory
$backupDir = "app\api\chatbot\chat-v1-backup"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

# Backup v1 route
Write-Host "Backing up v1 route..." -ForegroundColor Yellow
Copy-Item "app\api\chatbot\chat\route.ts" "$backupDir\route.ts" -Force

# Copy v2 to main route
Write-Host "Activating v2 route..." -ForegroundColor Yellow
Copy-Item "app\api\chatbot\chat-v2\route.ts" "app\api\chatbot\chat\route.ts" -Force

Write-Host "`nSwitch complete!" -ForegroundColor Green
Write-Host "v1 backed up to: $backupDir" -ForegroundColor Cyan
Write-Host "v2 is now active at: app\api\chatbot\chat\route.ts" -ForegroundColor Cyan
Write-Host "`nWidget is already using v2 (ChatbotWidget-v2.tsx)" -ForegroundColor Green
