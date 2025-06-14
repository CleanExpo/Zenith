@echo off
echo 🛑 Stopping Zenith Platform - Full Stack...
echo.

REM Navigate to the stack directory
cd /d "D:\Zenith\zenith-stack"

echo 🐳 Stopping Docker containers...
docker-compose down

echo.
echo 📊 Container status:
docker-compose ps

echo.
echo ✅ Zenith Platform stopped successfully!
echo.
echo 💡 To start again, run: start-zenith-stack.bat
echo 🧹 To clean everything: docker-compose down -v
echo.
pause