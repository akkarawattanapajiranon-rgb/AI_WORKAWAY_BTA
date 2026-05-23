@echo off
title Workaway Recording & Dashboard System
echo ==========================================================
echo       Workaway Recording & Dashboard System Launcher
echo ==========================================================
echo.
cd /d "%~dp0"

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this system!
    echo Please install Node.js from https://nodejs.org/ first.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists, if not run npm install
if not exist node_modules (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo [INFO] Dependencies installed successfully.
)

:: Start the server and open the browser
echo [INFO] Starting Backend Server...
start "" http://localhost:3000
node server.js

pause
