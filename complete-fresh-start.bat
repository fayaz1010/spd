@echo off
echo ========================================
echo Creating completely fresh Git repository
echo ========================================

REM Backup .git folder just in case
if exist .git.backup rd /s /q .git.backup
if exist .git move .git .git.backup

REM Initialize completely new repository
git init
git branch -M main

REM Add remote
git remote add origin https://github.com/fayaz1010/spd.git

REM Verify core file doesn't exist
if exist webapp\nextjs_space\core (
    echo ERROR: Core file still exists! Deleting...
    del /f webapp\nextjs_space\core
)

REM Stage all files (core is in .gitignore)
git add -A

REM Show what will be committed
echo.
echo Files to be committed:
git status --short | find /c /v ""
echo.

REM Create commit
git commit -m "SPD Solar Complete System - Clean Backup Oct 25 2025"

echo.
echo ========================================
echo Repository ready! Now pushing...
echo ========================================

REM Push with force
git push -u origin main --force

echo.
echo ========================================
echo BACKUP COMPLETE!
echo ========================================
pause
