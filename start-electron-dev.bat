@echo off
echo Starting ChefMate Electron Application in Development Mode
echo.
echo Step 1: Starting React Development Server...
start /b cmd /c "npm start"
echo Waiting for React server to start...
timeout /t 10 /nobreak >nul
echo.
echo Step 2: Starting Electron Application...
electron .
pause