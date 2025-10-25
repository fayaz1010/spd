# 🔒 SPD Backup System Documentation

## Overview

Complete backup system for Sun Direct Power application with automated Git and database backups.

---

## 📦 Backup Components

### 1. **Git Backup** (Code & Files)
- **Location:** GitHub repository
- **URL:** https://github.com/fayaz1010/spd.git
- **Frequency:** Hourly (automated)
- **Manual:** `.\scripts\git-backup.ps1`

### 2. **Database Backup** (PostgreSQL)
- **Location:** `D:\SPD\backups\database\`
- **Database:** sundirect_solar
- **Frequency:** Daily at 2 AM (automated)
- **Retention:** 30 days
- **Manual:** `.\scripts\database-backup.ps1`

### 3. **Full Backup** (Git + Database)
- **Frequency:** Weekly on Sunday at 3 AM
- **Manual:** `.\scripts\full-backup.ps1`

---

## 🚀 Quick Start

### Initial Setup

1. **Run as Administrator:**
```powershell
cd D:\SPD\scripts
.\setup-scheduled-backups.ps1
```

This creates 3 scheduled tasks:
- ✅ Hourly Git Backup
- ✅ Daily Database Backup (2 AM)
- ✅ Weekly Full Backup (Sunday 3 AM)

### Manual Backups

**Git Backup:**
```powershell
.\scripts\git-backup.ps1
# With custom message:
.\scripts\git-backup.ps1 -Message "Before major update"
```

**Database Backup:**
```powershell
.\scripts\database-backup.ps1
# With compression:
.\scripts\database-backup.ps1 -Compress
```

**Full Backup:**
```powershell
.\scripts\full-backup.ps1 -Compress
```

---

## 🔄 Restore Procedures

### Restore from Git

```powershell
cd D:\SPD
git pull origin main
```

### Restore Database

**Interactive (select from list):**
```powershell
.\scripts\database-restore.ps1
```

**Latest backup:**
```powershell
.\scripts\database-restore.ps1 -Latest
```

**Specific backup:**
```powershell
.\scripts\database-restore.ps1 -BackupFile "D:\SPD\backups\database\backup_sundirect_solar_2025-10-25_14-30-00.sql"
```

**Force restore (no confirmation):**
```powershell
.\scripts\database-restore.ps1 -Latest -Force
```

---

## 📋 Backup Schedule

| Type | Frequency | Time | Retention |
|------|-----------|------|-----------|
| Git | Hourly | Every hour | Unlimited (GitHub) |
| Database | Daily | 2:00 AM | 30 days |
| Full | Weekly | Sunday 3:00 AM | 30 days |

---

## 📁 Backup Locations

### Git Backups
- **Remote:** https://github.com/fayaz1010/spd.git
- **Local:** D:\SPD\.git\

### Database Backups
- **Location:** D:\SPD\backups\database\
- **Format:** `backup_sundirect_solar_YYYY-MM-DD_HH-mm-ss.sql`
- **Compressed:** `backup_sundirect_solar_YYYY-MM-DD_HH-mm-ss.sql.gz`

---

## 🛠️ Managing Scheduled Tasks

### View all SPD backup tasks:
```powershell
Get-ScheduledTask | Where-Object {$_.TaskName -like 'SPD*'}
```

### Run a task manually:
```powershell
Start-ScheduledTask -TaskName "SPD - Hourly Git Backup"
Start-ScheduledTask -TaskName "SPD - Daily Database Backup"
Start-ScheduledTask -TaskName "SPD - Weekly Full Backup"
```

### Disable a task:
```powershell
Disable-ScheduledTask -TaskName "SPD - Hourly Git Backup"
```

### Enable a task:
```powershell
Enable-ScheduledTask -TaskName "SPD - Hourly Git Backup"
```

### Remove a task:
```powershell
Unregister-ScheduledTask -TaskName "SPD - Hourly Git Backup" -Confirm:$false
```

---

## 🔍 Monitoring Backups

### Check Git backup status:
```powershell
cd D:\SPD
git log --oneline -10
git remote -v
```

### Check database backups:
```powershell
Get-ChildItem D:\SPD\backups\database\ -Filter "backup_*.sql*" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object Name, Length, LastWriteTime -First 10
```

### View scheduled task history:
```powershell
Get-ScheduledTask -TaskName "SPD*" | Get-ScheduledTaskInfo
```

---

## ⚠️ Important Notes

### Git Backup
- ✅ Automatically commits all changes
- ✅ Pushes to GitHub
- ✅ Handles merge conflicts
- ⚠️ Requires Git credentials configured
- ⚠️ Requires internet connection

### Database Backup
- ✅ Creates timestamped backups
- ✅ Automatic compression available
- ✅ Automatic cleanup (30 days)
- ⚠️ Requires PostgreSQL installed
- ⚠️ Requires database credentials

### Restore
- ⚠️ **Database restore will OVERWRITE current data**
- ⚠️ Always confirm before restoring
- ✅ Terminates active connections
- ✅ Creates fresh database

---

## 🔐 Security

### Protected Files (Not in Git)
- `.env` - Environment variables
- `*.sql` - Database backups
- `backups/` - All backup files
- `node_modules/` - Dependencies
- `.next/` - Build artifacts

### Credentials
- Git: Uses Windows Credential Manager
- Database: Stored in `.env` file
- Backups: Local filesystem only

---

## 📊 Backup Statistics

### Typical Sizes
- **Git repository:** ~500 MB
- **Database backup:** ~50-100 MB (uncompressed)
- **Database backup:** ~10-20 MB (compressed)
- **Full backup:** ~520 MB total

### Storage Requirements
- **Git:** Unlimited (GitHub)
- **Database:** ~3 GB (30 days × 100 MB)
- **Recommended:** 10 GB free space

---

## 🚨 Disaster Recovery

### Complete System Restore

1. **Clone repository:**
```powershell
git clone https://github.com/fayaz1010/spd.git D:\SPD
cd D:\SPD
```

2. **Install dependencies:**
```powershell
cd webapp\nextjs_space
npm install
```

3. **Restore database:**
```powershell
cd D:\SPD\scripts
.\database-restore.ps1 -Latest
```

4. **Configure environment:**
```powershell
# Copy .env.example to .env
# Update with your credentials
```

5. **Start application:**
```powershell
cd D:\SPD\webapp\nextjs_space
npm run dev
```

---

## 📞 Troubleshooting

### Git Backup Fails
```powershell
# Check Git status
git status

# Check remote connection
git remote -v

# Test push manually
git push origin main
```

### Database Backup Fails
```powershell
# Check PostgreSQL is running
Get-Service postgresql*

# Test connection
psql -h localhost -p 5433 -U postgres -d sundirect_solar

# Check disk space
Get-PSDrive D
```

### Scheduled Task Not Running
```powershell
# Check task status
Get-ScheduledTask -TaskName "SPD*"

# View task history
Get-ScheduledTask -TaskName "SPD - Hourly Git Backup" | Get-ScheduledTaskInfo

# Run manually to test
Start-ScheduledTask -TaskName "SPD - Hourly Git Backup"
```

---

## 📝 Maintenance

### Weekly
- ✅ Verify backups are running
- ✅ Check backup sizes
- ✅ Test restore procedure

### Monthly
- ✅ Review backup retention
- ✅ Clean up old backups manually if needed
- ✅ Update backup scripts if needed

### Quarterly
- ✅ Full disaster recovery test
- ✅ Review backup strategy
- ✅ Update documentation

---

## 🎯 Best Practices

1. **Always test restores** - Backups are useless if you can't restore
2. **Monitor backup sizes** - Sudden changes indicate issues
3. **Keep multiple backup types** - Git + Database + Offsite
4. **Document changes** - Update this file when changing backup strategy
5. **Automate everything** - Manual backups are forgotten backups
6. **Test disaster recovery** - Practice full system restore quarterly

---

## 📚 Additional Resources

- **Git Documentation:** https://git-scm.com/doc
- **PostgreSQL Backup:** https://www.postgresql.org/docs/current/backup.html
- **Windows Task Scheduler:** https://docs.microsoft.com/en-us/windows/win32/taskschd/

---

## ✅ Backup System Status

| Component | Status | Last Backup | Next Backup |
|-----------|--------|-------------|-------------|
| Git | ✅ Active | Check `git log` | Every hour |
| Database | ✅ Active | Check backup folder | Daily 2 AM |
| Full | ✅ Active | Check backup folder | Sunday 3 AM |

---

**Last Updated:** 2025-10-25  
**Version:** 1.0  
**Maintained by:** SPD Development Team
