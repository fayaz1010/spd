@echo off
cd /d D:\SPD

echo Staging all changes...
git add -A

echo Creating commit...
git commit -m "SPD Solar Complete System Backup - Oct 25 2025"

echo Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Git backup completed successfully!
echo Repository: https://github.com/fayaz1010/spd.git
echo ========================================
pause
