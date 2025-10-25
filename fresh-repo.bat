@echo off
echo Creating fresh repository without core file...

REM Remove git history
rd /s /q .git

REM Initialize new repo
git init
git branch -M main

REM Add remote
git remote add origin https://github.com/fayaz1010/spd.git

REM Stage all files (core is already in .gitignore)
git add -A

REM Create commit
git commit -m "SPD Solar Complete System - Fresh Backup Oct 25 2025"

echo.
echo Fresh repository created! Ready to push.
echo Run: git push -u origin main --force
pause
