@echo off
echo 🚀 Starting Zenith Platform - Full Stack...
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Docker is not running or not installed.
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Check if WSL is available
wsl --list --quiet >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: WSL is not installed or not running.
    echo Please install WSL2 first.
    pause
    exit /b 1
)

echo ✅ WSL2 is available
echo.

REM Navigate to the stack directory
cd /d "D:\Zenith\zenith-stack"

echo 📦 Setting up environment...
if not exist ".env" (
    echo Creating .env file from example...
    copy .env.example .env
)

echo 🐳 Starting Docker containers...
docker-compose up -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo 🔍 Checking service status...
docker-compose ps

echo.
echo 🎉 Zenith Platform is starting up!
echo.
echo 📊 Service URLs:
echo ==========================================
echo 🌐 Frontend Dashboard: http://localhost:3000
echo 🔌 Backend API:        http://localhost:3001
echo 🗄️  PostgreSQL:        localhost:5432
echo 🔑 pgAdmin:           http://localhost:5050
echo 📝 Redis Cache:       localhost:6379
echo 🧪 Redis Commander:   http://localhost:8081
echo.
echo 🔐 Database Credentials:
echo Username: zenith_user
echo Password: zenith_pass
echo Database: zenith_db
echo.
echo 📋 pgAdmin Credentials:
echo Email:    admin@zenith.local
echo Password: zenith_admin_pass
echo.
echo 💡 Useful Commands:
echo ==========================================
echo View logs:     docker-compose logs -f [service]
echo Stop stack:    docker-compose down
echo Restart:       docker-compose restart
echo Full rebuild:  docker-compose down -v && docker-compose up -d --build
echo.

REM Wait a bit more and check if frontend is responding
echo ⏳ Checking if frontend is ready...
timeout /t 15 /nobreak >nul

curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is ready!
    echo.
    echo Press any key to open the dashboard...
    pause >nul
    start http://localhost:3000
) else (
    echo ⚠️  Frontend is still starting up. This may take a few more minutes.
    echo You can manually check http://localhost:3000 when ready.
    echo.
    pause
)