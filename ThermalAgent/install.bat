@echo off
echo ============================================
echo  Installing Thermal Printer Agent Service
echo ============================================
echo.

set SERVICE_NAME=ThermalPrinterAgent
set EXE_PATH=C:\ThermalAgent\thermal-printer-agent.exe
set DISPLAY_NAME=Thermal Printer Agent

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
    echo ERROR: Cannot find thermal-printer-agent.exe
    echo Expected location: %EXE_PATH%
    pause
    exit /b 1
)

REM Create the service
echo Creating service...
sc create "%SERVICE_NAME%" binPath= "%EXE_PATH%" DisplayName= "%DISPLAY_NAME%" start= auto obj= LocalSystem
if %errorLevel% neq 0 (
    echo ERROR: Failed to create service
    pause
    exit /b 1
)

REM Set description
sc description "%SERVICE_NAME%" "Local Node.js Agent Server for thermal printer control via ESC/POS commands"

REM Configure failure recovery
sc failure "%SERVICE_NAME%" reset= 86400 actions= restart/60000/restart/60000/restart/60000

REM Start the service
echo Starting service...
sc start "%SERVICE_NAME%"

echo.
echo ============================================
echo  Installation Complete!
echo ============================================
echo.
echo Service: %DISPLAY_NAME%
echo Status: Check services.msc
echo Server: http://localhost:6001
echo.
echo Log file: C:\ThermalAgent\service.log
echo.
pause
