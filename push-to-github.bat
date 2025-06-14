@echo off
echo 🚀 Pushing Zenith Platform to GitHub...
echo.

REM Navigate to the stack directory
cd /d "D:\Zenith\zenith-stack"

REM Check if we're in a git repository
if not exist ".git" (
    echo ❌ ERROR: Not a git repository.
    echo Please run setup-git.bat first.
    pause
    exit /b 1
)

echo 📡 Checking GitHub connectivity...
git remote -v

echo.
echo 🔄 Fetching latest changes from GitHub...
git fetch origin

echo.
echo 📤 Pushing to GitHub repository...
echo.
echo ⚠️  You may be prompted for GitHub authentication.
echo    If you haven't set up authentication, you may need to:
echo    1. Use a personal access token instead of password
echo    2. Or set up SSH keys
echo.

REM Try to push to main branch
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ Successfully pushed to GitHub!
    echo 🌐 View your repository: https://github.com/CleanExpo/Zenith
    echo.
    echo 📋 Repository includes:
    echo - Complete Zenith Platform source code
    echo - Docker configuration for easy deployment
    echo - Documentation and setup instructions
    echo - Multi-agent AI system
    echo - Frontend dashboard and backend API
    echo.
) else (
    echo.
    echo ❌ Push failed. This might be due to:
    echo 1. Authentication issues - try using a personal access token
    echo 2. Network connectivity problems
    echo 3. Repository permissions
    echo.
    echo 💡 Try these solutions:
    echo 1. Generate a personal access token: https://github.com/settings/tokens
    echo 2. Use: git push https://your-token@github.com/CleanExpo/Zenith.git main
    echo 3. Or set up SSH keys for GitHub
    echo.
)

echo.
pause