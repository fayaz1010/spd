# Database Backup Script
# Creates PostgreSQL database backups with rotation

param(
    [string]$BackupDir = "D:\SPD\backups\database",
    [int]$RetentionDays = 30,
    [switch]$Compress
)

Write-Host "🗄️ Starting Database Backup..." -ForegroundColor Cyan

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "📁 Created backup directory: $BackupDir" -ForegroundColor Green
}

# Database configuration (from .env)
$DbHost = "localhost"
$DbPort = "5433"
$DbName = "sundirect_solar"
$DbUser = "postgres"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = Join-Path $BackupDir "backup_${DbName}_${Timestamp}.sql"

Write-Host "📊 Database: $DbName" -ForegroundColor Gray
Write-Host "🏠 Host: ${DbHost}:${DbPort}" -ForegroundColor Gray
Write-Host "📁 Backup file: $BackupFile" -ForegroundColor Gray

# Set PostgreSQL password environment variable
$env:PGPASSWORD = "postgres"

# Create backup using pg_dump
Write-Host "`n💾 Creating backup..." -ForegroundColor Cyan
try {
    & "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" `
        -h $DbHost `
        -p $DbPort `
        -U $DbUser `
        -d $DbName `
        -F p `
        -f $BackupFile `
        --verbose
    
    if ($LASTEXITCODE -eq 0) {
        $FileSize = (Get-Item $BackupFile).Length / 1MB
        Write-Host "✅ Backup created successfully!" -ForegroundColor Green
        Write-Host "📦 Size: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Gray
        
        # Compress if requested
        if ($Compress) {
            Write-Host "`n🗜️ Compressing backup..." -ForegroundColor Cyan
            $CompressedFile = "$BackupFile.gz"
            & gzip -9 $BackupFile
            
            if (Test-Path $CompressedFile) {
                $CompressedSize = (Get-Item $CompressedFile).Length / 1MB
                Write-Host "✅ Compressed: $([math]::Round($CompressedSize, 2)) MB" -ForegroundColor Green
                $BackupFile = $CompressedFile
            }
        }
    } else {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Backup failed: $_" -ForegroundColor Red
    exit 1
}

# Clean up old backups
Write-Host "`n🧹 Cleaning up old backups..." -ForegroundColor Cyan
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)
$OldBackups = Get-ChildItem $BackupDir -Filter "backup_*.sql*" | Where-Object { $_.LastWriteTime -lt $CutoffDate }

if ($OldBackups) {
    $OldBackups | ForEach-Object {
        Write-Host "🗑️ Removing: $($_.Name)" -ForegroundColor Yellow
        Remove-Item $_.FullName -Force
    }
    Write-Host "✅ Removed $($OldBackups.Count) old backup(s)" -ForegroundColor Green
} else {
    Write-Host "✅ No old backups to remove" -ForegroundColor Green
}

# Show backup summary
Write-Host "`n📊 Backup Summary:" -ForegroundColor Cyan
$AllBackups = Get-ChildItem $BackupDir -Filter "backup_*.sql*" | Sort-Object LastWriteTime -Descending
Write-Host "📁 Total backups: $($AllBackups.Count)" -ForegroundColor Gray
Write-Host "💾 Total size: $([math]::Round(($AllBackups | Measure-Object Length -Sum).Sum / 1MB, 2)) MB" -ForegroundColor Gray
Write-Host "📅 Oldest: $($AllBackups[-1].LastWriteTime.ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Gray
Write-Host "📅 Newest: $($AllBackups[0].LastWriteTime.ToString('yyyy-MM-dd HH:mm'))" -ForegroundColor Gray

Write-Host "`n✨ Backup complete!" -ForegroundColor Green

# Clear password
$env:PGPASSWORD = $null
