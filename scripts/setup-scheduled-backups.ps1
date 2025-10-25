# Setup Scheduled Backup Tasks
# Creates Windows Task Scheduler jobs for automated backups

# Requires Administrator privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ This script requires Administrator privileges" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host "⚙️ Setting up Scheduled Backup Tasks..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray

$ScriptPath = "D:\SPD\scripts"

# Task 1: Hourly Git Backup
Write-Host "`n📦 Task 1: Hourly Git Backup" -ForegroundColor Yellow
$GitAction = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath\git-backup.ps1`""

$GitTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)

$GitSettings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable

Register-ScheduledTask `
    -TaskName "SPD - Hourly Git Backup" `
    -Action $GitAction `
    -Trigger $GitTrigger `
    -Settings $GitSettings `
    -Description "Automatically backs up SPD code to GitHub every hour" `
    -Force | Out-Null

Write-Host "✅ Hourly Git Backup task created" -ForegroundColor Green

# Task 2: Daily Database Backup (2 AM)
Write-Host "`n🗄️ Task 2: Daily Database Backup (2 AM)" -ForegroundColor Yellow
$DbAction = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath\database-backup.ps1`" -Compress"

$DbTrigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

$DbSettings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName "SPD - Daily Database Backup" `
    -Action $DbAction `
    -Trigger $DbTrigger `
    -Settings $DbSettings `
    -Description "Automatically backs up SPD database daily at 2 AM" `
    -Force | Out-Null

Write-Host "✅ Daily Database Backup task created" -ForegroundColor Green

# Task 3: Weekly Full Backup (Sunday 3 AM)
Write-Host "`n🚀 Task 3: Weekly Full Backup (Sunday 3 AM)" -ForegroundColor Yellow
$FullAction = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath\full-backup.ps1`" -Compress"

$FullTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3:00AM

$FullSettings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName "SPD - Weekly Full Backup" `
    -Action $FullAction `
    -Trigger $FullTrigger `
    -Settings $FullSettings `
    -Description "Automatically performs full backup (Git + Database) every Sunday at 3 AM" `
    -Force | Out-Null

Write-Host "✅ Weekly Full Backup task created" -ForegroundColor Green

# Summary
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "✅ Scheduled Tasks Created Successfully!" -ForegroundColor Green
Write-Host "`n📋 Backup Schedule:" -ForegroundColor Cyan
Write-Host "  • Git Backup: Every hour" -ForegroundColor Gray
Write-Host "  • Database Backup: Daily at 2:00 AM" -ForegroundColor Gray
Write-Host "  • Full Backup: Weekly on Sunday at 3:00 AM" -ForegroundColor Gray

Write-Host "`n💡 To manage tasks:" -ForegroundColor Yellow
Write-Host "  • View: Get-ScheduledTask | Where-Object {`$_.TaskName -like 'SPD*'}" -ForegroundColor Gray
Write-Host "  • Run now: Start-ScheduledTask -TaskName 'SPD - Hourly Git Backup'" -ForegroundColor Gray
Write-Host "  • Disable: Disable-ScheduledTask -TaskName 'SPD - Hourly Git Backup'" -ForegroundColor Gray
Write-Host "  • Remove: Unregister-ScheduledTask -TaskName 'SPD - Hourly Git Backup'" -ForegroundColor Gray

Write-Host "`n✨ Setup complete!" -ForegroundColor Green
