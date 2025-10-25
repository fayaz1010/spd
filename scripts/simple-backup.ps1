# Simple Database Backup Script
# No special characters

param(
    [string]$BackupDir = "D:\SPD\backups\database"
)

Write-Host "Starting database backup..."

# Create backup directory
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Database config
$DbHost = "localhost"
$DbPort = "5433"
$DbName = "sundirect_solar"
$DbUser = "postgres"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = Join-Path $BackupDir "backup_${DbName}_${Timestamp}.sql"

Write-Host "Backup file: $BackupFile"

# Set password
$env:PGPASSWORD = "postgres"

# Create backup
Write-Host "Creating backup..."
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" `
    -h $DbHost `
    -p $DbPort `
    -U $DbUser `
    -d $DbName `
    -F p `
    -f $BackupFile

if ($LASTEXITCODE -eq 0) {
    $FileSize = (Get-Item $BackupFile).Length / 1MB
    Write-Host "SUCCESS! Backup created: $([math]::Round($FileSize, 2)) MB"
    
    # Compress
    Write-Host "Compressing..."
    & gzip -9 $BackupFile
    
    if (Test-Path "$BackupFile.gz") {
        $CompressedSize = (Get-Item "$BackupFile.gz").Length / 1MB
        Write-Host "Compressed: $([math]::Round($CompressedSize, 2)) MB"
    }
} else {
    Write-Host "ERROR: Backup failed"
    exit 1
}

# Clean up old backups (30 days)
$CutoffDate = (Get-Date).AddDays(-30)
$OldBackups = Get-ChildItem $BackupDir -Filter "backup_*.sql*" | Where-Object { $_.LastWriteTime -lt $CutoffDate }

if ($OldBackups) {
    Write-Host "Removing $($OldBackups.Count) old backup(s)"
    $OldBackups | Remove-Item -Force
}

# Show summary
$AllBackups = Get-ChildItem $BackupDir -Filter "backup_*.sql*"
Write-Host "Total backups: $($AllBackups.Count)"

$env:PGPASSWORD = $null
Write-Host "Backup complete!"
