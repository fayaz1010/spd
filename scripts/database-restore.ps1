# Database Restore Script
# Restores PostgreSQL database from backup

param(
    [Parameter(Mandatory=$false)]
    [string]$BackupFile,
    [string]$BackupDir = "D:\SPD\backups\database",
    [switch]$Latest,
    [switch]$Force
)

Write-Host "🔄 Database Restore Utility" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray

# Database configuration
$DbHost = "localhost"
$DbPort = "5433"
$DbName = "sundirect_solar"
$DbUser = "postgres"

# Find backup file
if ($Latest) {
    Write-Host "`n🔍 Finding latest backup..." -ForegroundColor Cyan
    $BackupFile = Get-ChildItem $BackupDir -Filter "backup_*.sql*" | 
                  Sort-Object LastWriteTime -Descending | 
                  Select-Object -First 1 -ExpandProperty FullName
    
    if (-not $BackupFile) {
        Write-Host "❌ No backups found in $BackupDir" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Found: $(Split-Path $BackupFile -Leaf)" -ForegroundColor Green
} elseif (-not $BackupFile) {
    Write-Host "`n📋 Available backups:" -ForegroundColor Cyan
    $Backups = Get-ChildItem $BackupDir -Filter "backup_*.sql*" | Sort-Object LastWriteTime -Descending
    
    if (-not $Backups) {
        Write-Host "❌ No backups found in $BackupDir" -ForegroundColor Red
        exit 1
    }
    
    for ($i = 0; $i -lt $Backups.Count; $i++) {
        $Backup = $Backups[$i]
        $Size = [math]::Round($Backup.Length / 1MB, 2)
        $Date = $Backup.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')
        Write-Host "$($i + 1). $($Backup.Name) - $Size MB - $Date" -ForegroundColor Gray
    }
    
    $Selection = Read-Host "`nSelect backup number (or 'q' to quit)"
    if ($Selection -eq 'q') { exit 0 }
    
    $Index = [int]$Selection - 1
    if ($Index -lt 0 -or $Index -ge $Backups.Count) {
        Write-Host "❌ Invalid selection" -ForegroundColor Red
        exit 1
    }
    
    $BackupFile = $Backups[$Index].FullName
}

# Verify backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "`n📊 Restore Details:" -ForegroundColor Cyan
Write-Host "📁 Backup: $(Split-Path $BackupFile -Leaf)" -ForegroundColor Gray
Write-Host "💾 Size: $([math]::Round((Get-Item $BackupFile).Length / 1MB, 2)) MB" -ForegroundColor Gray
Write-Host "🗄️ Database: $DbName" -ForegroundColor Gray
Write-Host "🏠 Host: ${DbHost}:${DbPort}" -ForegroundColor Gray

# Confirm restore
if (-not $Force) {
    Write-Host "`n⚠️ WARNING: This will OVERWRITE the current database!" -ForegroundColor Yellow
    $Confirm = Read-Host "Type 'YES' to confirm restore"
    
    if ($Confirm -ne 'YES') {
        Write-Host "❌ Restore cancelled" -ForegroundColor Red
        exit 0
    }
}

# Decompress if needed
$TempFile = $BackupFile
if ($BackupFile -like "*.gz") {
    Write-Host "`n🗜️ Decompressing backup..." -ForegroundColor Cyan
    $TempFile = $BackupFile -replace '\.gz$', ''
    & gunzip -c $BackupFile > $TempFile
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Decompression failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Decompressed" -ForegroundColor Green
}

# Set PostgreSQL password
$env:PGPASSWORD = "postgres"

# Drop existing connections
Write-Host "`n🔌 Terminating active connections..." -ForegroundColor Cyan
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" `
    -h $DbHost `
    -p $DbPort `
    -U $DbUser `
    -d postgres `
    -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DbName' AND pid <> pg_backend_pid();"

# Drop and recreate database
Write-Host "🗑️ Dropping existing database..." -ForegroundColor Cyan
& "C:\Program Files\PostgreSQL\16\bin\dropdb.exe" `
    -h $DbHost `
    -p $DbPort `
    -U $DbUser `
    --if-exists `
    $DbName

Write-Host "🆕 Creating new database..." -ForegroundColor Cyan
& "C:\Program Files\PostgreSQL\16\bin\createdb.exe" `
    -h $DbHost `
    -p $DbPort `
    -U $DbUser `
    $DbName

# Restore backup
Write-Host "📥 Restoring backup..." -ForegroundColor Cyan
try {
    & "C:\Program Files\PostgreSQL\16\bin\psql.exe" `
        -h $DbHost `
        -p $DbPort `
        -U $DbUser `
        -d $DbName `
        -f $TempFile `
        --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database restored successfully!" -ForegroundColor Green
    } else {
        throw "psql failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "❌ Restore failed: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temp file if we decompressed
    if ($TempFile -ne $BackupFile -and (Test-Path $TempFile)) {
        Remove-Item $TempFile -Force
    }
    
    # Clear password
    $env:PGPASSWORD = $null
}

Write-Host "`n✨ Restore complete!" -ForegroundColor Green
