@echo off
echo ============================================
echo  Installing ChefMate Print Server Service
echo ============================================
echo.

set SERVICE_NAME=ChefMatePrintServer
set DISPLAY_NAME=ChefMate Print Server

REM Try to find the exe in current directory first
set EXE_PATH=%~dp0print-server.exe

REM If not in current directory, check C:\ChefMatePrintServer
if not exist "%EXE_PATH%" (
    set EXE_PATH=C:\ChefMatePrintServer\print-server.exe
)

echo Looking for print-server.exe...
echo Checking: %EXE_PATH%

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

REM Check if service already exists
sc query %SERVICE_NAME% >nul 2>&1
if %errorLevel% equ 0 (
    echo Service already exists. Uninstalling first...
    sc stop %SERVICE_NAME%
    timeout /t 2 /nobreak >nul
    sc delete %SERVICE_NAME%
    timeout /t 2 /nobreak >nul
)

REM Check if exe exists
if not exist "%EXE_PATH%" (
    echo ERROR: Cannot find print-server.exe
    echo.
    echo Please ensure:
    echo 1. The exe is in the same folder as install.bat, OR
    echo 2. Copy everything to C:\ChefMatePrintServer
    echo.
    echo Current directory: %~dp0
    pause
    exit /b 1
)

echo Found exe at: %EXE_PATH%
echo.

REM Create the service
echo Creating service...
sc create "%SERVICE_NAME%" binPath= "%EXE_PATH%" DisplayName= "%DISPLAY_NAME%" start= auto obj= LocalSystem
if %errorLevel% neq 0 (
    echo ERROR: Failed to create service
    pause
    exit /b 1
)

REM Set description
sc description "%SERVICE_NAME%" "ChefMate KOT Thermal Print Server - Windows & Android compatible"

REM Configure failure recovery
echo Configuring failure recovery...
sc failure "%SERVICE_NAME%" reset= 86400 actions= restart/5000/restart/10000/restart/30000

REM Start the service
echo Starting service...
sc start %SERVICE_NAME%
if %errorLevel% neq 0 (
    echo WARNING: Service created but failed to start
    echo Check the service.log file for errors
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Installation Complete!
echo ============================================
echo.
echo Service Name: %SERVICE_NAME%
echo Service Status: Running
echo Port: 7001
echo.
echo To check service status: sc query %SERVICE_NAME%
echo To stop service: sc stop %SERVICE_NAME%
echo To start service: sc start %SERVICE_NAME%
echo.
echo Check service.log for runtime logs
echo.
pause
