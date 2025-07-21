@echo off
echo ========================================
echo    EasyDoc2 - Document Processing Platform
echo ========================================
echo.

echo [1/4] Checking dependencies...
cd backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed.
)

echo.
cd ..\frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed.
)

echo.
echo [2/4] Building TypeScript...
cd ..\backend
call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo TypeScript compilation check failed, but continuing...
)

echo.
echo [3/4] Starting backend server...
start "EasyDoc2 Backend" cmd /k "npm run dev"

echo.
echo [4/4] Waiting for backend to start...
timeout /t 8 /nobreak > nul

echo Starting frontend application...
cd ..\frontend
start "EasyDoc2 Frontend" cmd /k "npm start"

echo.
echo ========================================
echo    EasyDoc2 is starting up...
echo ========================================
echo.
echo Backend API: http://localhost:3001
echo Frontend UI: http://localhost:3000
echo.
echo IMPORTANT:
echo 1. Make sure MongoDB is running
echo 2. Add your EasyDoc API key to backend/.env
echo 3. Get API key from: https://easydoc.sh/contact-us
echo.
echo Press any key to exit...
pause > nul
