@echo off
echo ============================================
echo  Building ChefMate Print Server Package
echo ============================================
echo.

REM Check if node is installed
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if %errorLevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Step 1: Building Windows executable...
call npm run build:windows
if %errorLevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo Step 2: Creating service package...
call npm run build:service
if %errorLevel% neq 0 (
    echo ERROR: Package creation failed
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Build Complete!
echo ============================================
echo.
echo Package created: dist\ChefMatePrintServer-WindowsService.zip
echo.
echo To deploy:
echo 1. Extract the ZIP file
echo 2. Copy ChefMatePrintServer folder to C:\
echo 3. Run install.bat as Administrator
echo.
pause
