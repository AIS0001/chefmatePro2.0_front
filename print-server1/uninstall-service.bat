@echo off
REM Change to the script's directory
cd /d "%~dp0"

echo ============================================
echo  ChefMate Print Server - Service Uninstaller
echo ============================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Uninstall the service
echo.
echo Uninstalling service...
node uninstall-windows-service.js

pause
