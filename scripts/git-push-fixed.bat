@echo off
cd /d D:\SPD
git add .gitignore
git commit -m "Remove large core file from git tracking"
git push -u origin main --force
echo.
echo Backup pushed to GitHub successfully!
pause
