@echo off
echo ========================================
echo NUCLEAR OPTION: Complete Git Reset
echo ========================================

REM Delete entire .git folder
rd /s /q .git
rd /s /q .git.backup

REM Delete the core file if it exists
if exist webapp\nextjs_space\core del /f webapp\nextjs_space\core

REM Initialize brand new repository
git init
git branch -M main
git remote add origin https://github.com/fayaz1010/spd.git

REM Stage everything (core is in .gitignore so won't be added)
git add -A

REM Commit
git commit -m "SPD Solar Complete System Backup - Oct 25 2025"

echo.
echo Repository created fresh. File count:
git ls-files | find /c /v ""

echo.
echo Checking for core file in git:
git ls-files | findstr /i core

echo.
echo Ready to push!
pause

REM Push
git push -u origin main --force

echo.
echo ========================================
echo SUCCESS! Backup pushed to GitHub
echo ========================================
pause
