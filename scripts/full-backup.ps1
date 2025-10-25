# Full Backup Script
# Backs up both Git repository and database

param(
    [string]$GitMessage = "Auto-backup: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    [switch]$SkipGit,
    [switch]$SkipDatabase,
    [switch]$Compress
)

Write-Host "Starting Full Backup System..." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Gray

$StartTime = Get-Date

# 1. Git Backup
if (-not $SkipGit) {
    Write-Host "`nStep 1: Git Backup" -ForegroundColor Yellow
    Write-Host "-------------------------------------------------------" -ForegroundColor Gray
    & "$PSScriptRoot\git-backup.ps1" -Message $GitMessage
} else {
    Write-Host "`nSkipping Git backup" -ForegroundColor Gray
}

# 2. Database Backup
if (-not $SkipDatabase) {
    Write-Host "`nStep 2: Database Backup" -ForegroundColor Yellow
    Write-Host "-------------------------------------------------------" -ForegroundColor Gray
    
    $BackupParams = @{}
    if ($Compress) { $BackupParams['Compress'] = $true }
    
    & "$PSScriptRoot\database-backup.ps1" @BackupParams
} else {
    Write-Host "`nSkipping database backup" -ForegroundColor Gray
}

# Summary
$Duration = (Get-Date) - $StartTime
Write-Host "`n=======================================================" -ForegroundColor Gray
Write-Host "Full Backup Complete!" -ForegroundColor Green
Write-Host "Duration: $([math]::Round($Duration.TotalSeconds, 2)) seconds" -ForegroundColor Gray
Write-Host "Completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Gray
