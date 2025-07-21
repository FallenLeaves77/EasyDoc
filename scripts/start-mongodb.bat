@echo off
echo Starting MongoDB...

REM 检查MongoDB是否已安装
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo MongoDB is not installed or not in PATH
    echo Please install MongoDB from: https://www.mongodb.com/try/download/community
    pause
    exit /b 1
)

REM 创建数据目录
if not exist "data\db" (
    mkdir data\db
    echo Created data directory
)

REM 启动MongoDB
echo Starting MongoDB server...
mongod --dbpath=data\db --port=27017

pause
