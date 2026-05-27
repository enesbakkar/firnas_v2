@echo off
echo ====================================================================
echo      Firnas Technologies - GitHub v2 Repository Push Assistant
echo ====================================================================
echo.
echo [1/6] Initializing Git repository (git init)...
git init

echo.
echo [2/6] Staging all files (git add .)...
git add .

echo.
echo [3/6] Creating initial commit (git commit)...
git commit -m "feat: redesign quick-nav cards and align branding with global peace and Ummah motto"

echo.
echo [4/6] Setting main branch (git branch -M main)...
git branch -M main

echo.
echo [5/6] Connecting to GitHub repository...
echo.
echo Please enter your GitHub username (e.g. enesb):
set /p username="Username: "

git remote remove origin 2>nul
git remote add origin https://github.com/%username%/firnas_v2.git

echo.
echo [6/6] Pushing code to GitHub (git push)...
echo.
echo NOTE: If this is your first time, a GitHub login prompt may appear.
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ====================================================================
    echo   SUCCESS! Your code has been pushed to 'firnas_v2' repository.
    echo ====================================================================
) else (
    echo.
    echo ====================================================================
    echo   ERROR: Push failed. Please check:
    echo   1. Your internet connection.
    echo   2. Your username is correct.
    echo   3. You created an empty repository named 'firnas_v2' on GitHub.
    echo ====================================================================
)
echo.
pause
