@echo off
echo Starting EasyDoc2 Development Environment...

REM 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM 检查npm是否安装
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo npm is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
cd /d "%~dp0..\backend"
start "Backend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Starting Frontend Server...
echo ========================================
cd /d "%~dp0..\frontend"
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Development servers are starting...
echo ========================================
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo Health Check: http://localhost:3001/api/health
echo.
echo ========================================
echo Database Configuration
echo ========================================
echo Database is currently DISABLED for easier development
echo The application runs in memory-only mode
echo.
echo To ENABLE database:
echo 1. Install and start MongoDB
echo 2. Edit backend/.env and set ENABLE_DATABASE=true
echo 3. Restart the backend server
echo.
pause
