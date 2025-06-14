@echo off
echo 🔗 Connecting Zenith Platform to GitHub...
echo.

REM Navigate to the stack directory
cd /d "D:\Zenith\zenith-stack"

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Git is not installed.
    echo Please install Git and try again.
    pause
    exit /b 1
)

echo ✅ Git is available
echo.

REM Initialize git repository
echo 📂 Initializing git repository...
git init

REM Add remote origin
echo 🌐 Adding GitHub remote...
git remote add origin https://github.com/CleanExpo/Zenith.git

REM Create .gitignore file
echo 📝 Creating .gitignore...
echo # Dependencies> .gitignore
echo node_modules/>> .gitignore
echo npm-debug.log*>> .gitignore
echo yarn-debug.log*>> .gitignore
echo yarn-error.log*>> .gitignore
echo.>> .gitignore
echo # Build outputs>> .gitignore
echo dist/>> .gitignore
echo build/>> .gitignore
echo .next/>> .gitignore
echo out/>> .gitignore
echo.>> .gitignore
echo # Environment variables>> .gitignore
echo .env>> .gitignore
echo .env.local>> .gitignore
echo .env.development.local>> .gitignore
echo .env.test.local>> .gitignore
echo .env.production.local>> .gitignore
echo.>> .gitignore
echo # Database>> .gitignore
echo *.db>> .gitignore
echo *.sqlite>> .gitignore
echo.>> .gitignore
echo # Logs>> .gitignore
echo logs/>> .gitignore
echo *.log>> .gitignore
echo.>> .gitignore
echo # IDEs>> .gitignore
echo .vscode/>> .gitignore
echo .idea/>> .gitignore
echo *.swp>> .gitignore
echo *.swo>> .gitignore
echo.>> .gitignore
echo # OS generated files>> .gitignore
echo .DS_Store>> .gitignore
echo .DS_Store?>> .gitignore
echo ._*>> .gitignore
echo .Spotlight-V100>> .gitignore
echo .Trashes>> .gitignore
echo ehthumbs.db>> .gitignore
echo Thumbs.db>> .gitignore
echo.>> .gitignore
echo # Docker>> .gitignore
echo .docker/>> .gitignore
echo.>> .gitignore
echo # TypeScript>> .gitignore
echo *.tsbuildinfo>> .gitignore
echo.>> .gitignore
echo # Prisma>> .gitignore
echo packages/database/dist/generated/>> .gitignore

REM Set git user (you may want to change these)
echo ⚙️ Setting git configuration...
git config user.name "Zenith Platform Team"
git config user.email "team@zenithplatform.com"

REM Add all files
echo 📦 Adding files to git...
git add .

REM Create initial commit
echo 💾 Creating initial commit...
git commit -m "feat: Complete Zenith Platform full stack implementation

🚀 Zenith Platform - Next-Generation Multi-Agent SaaS Platform

✨ Features:
- Next.js 14 Frontend with modern UI/UX
- Node.js/Express Backend with TypeScript
- PostgreSQL Database with Prisma ORM
- Redis Cache Layer for performance
- Multi-Agent AI System with 8 specialized agents
- Real-time WebSocket communications
- Docker Environment for easy deployment
- Authentication & Security built-in
- Admin Dashboard with analytics
- API Documentation and health monitoring

🏗️ Architecture:
- Frontend Layer: Next.js 14 + React 18 + Tailwind CSS
- API Gateway: Express.js + JWT Auth + Rate Limiting
- Multi-Agent System: 8 AI agents with orchestration
- Data Layer: PostgreSQL + Prisma + Redis Cache

🤖 AI Agents:
- Master Orchestrator Agent
- Onboarding Orchestrator Agent  
- Website Crawler Agent
- SEO Strategy Agent
- Content Generator Agent
- Visual Asset Generator Agent
- Quality Controller Agent
- Analytics Aggregator Agent

🐳 Docker Stack:
- Frontend (Next.js) - Port 3000
- Backend (Express) - Port 3001
- PostgreSQL - Port 5432
- Redis - Port 6379
- pgAdmin - Port 5050
- Redis Commander - Port 8081

🚀 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

echo.
echo ✅ Git repository initialized and committed!
echo.
echo 📋 Next steps:
echo 1. Review the commit with: git log --oneline
echo 2. Push to GitHub with: git push -u origin main
echo 3. Check GitHub repository: https://github.com/CleanExpo/Zenith
echo.
echo ⚠️  Note: You may need to authenticate with GitHub when pushing
echo.
pause