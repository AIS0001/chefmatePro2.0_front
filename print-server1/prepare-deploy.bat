@echo off
echo ============================================
echo  Preparing ChefMate Print Server for Deployment
echo ============================================
echo.

REM Ensure we're in the print-server directory
cd /d "%~dp0"

echo Step 1: Building executable...
call npm run build:windows
if %errorLevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Creating deployment folder...
set DEPLOY_DIR=dist\ChefMatePrintServer-Deploy

if exist "%DEPLOY_DIR%" (
    rmdir /s /q "%DEPLOY_DIR%"
)
mkdir "%DEPLOY_DIR%"

echo.
echo Step 3: Copying files...
copy "dist\print-server.exe" "%DEPLOY_DIR%\" >nul
copy "install.bat" "%DEPLOY_DIR%\" >nul
copy "uninstall.bat" "%DEPLOY_DIR%\" >nul

echo.
echo Step 4: Creating README...
(
echo ChefMate Print Server - Deployment Package
echo ==========================================
echo.
echo INSTALLATION:
echo 1. Copy this entire folder to C:\ChefMatePrintServer
echo    OR keep it anywhere you like
echo.
echo 2. Right-click install.bat and select "Run as administrator"
echo.
echo 3. The service will be installed and started automatically
echo.
echo 4. Test by opening: http://localhost:7001
echo.
echo UNINSTALL:
echo Right-click uninstall.bat and select "Run as administrator"
echo.
echo SERVICE INFO:
echo Name: ChefMatePrintServer
echo Port: 7001
echo Logs: service.log (created in same folder as exe^)
echo.
) > "%DEPLOY_DIR%\README.txt"

echo.
echo ============================================
echo  Package Ready!
echo ============================================
echo.
echo Location: %DEPLOY_DIR%
echo.
echo You can now:
echo 1. Copy the ChefMatePrintServer-Deploy folder to any Windows PC
echo 2. Run install.bat as Administrator
echo.
dir "%DEPLOY_DIR%"
echo.
pause
