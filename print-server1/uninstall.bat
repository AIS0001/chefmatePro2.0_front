@echo off
echo ============================================
echo  Uninstalling ChefMate Print Server Service
echo ============================================
echo.

set SERVICE_NAME=ChefMatePrintServer

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Check if service exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% neq 0 (
    echo Service is not installed.
    pause
    exit /b 0
)

REM Stop the service
echo Stopping service...
sc stop %SERVICE_NAME%
timeout /t 3 /nobreak

REM Delete the service
echo Removing service...
sc delete %SERVICE_NAME%

echo.
echo ============================================
echo  Uninstallation Complete!
echo ============================================
echo.
pause
