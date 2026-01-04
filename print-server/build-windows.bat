@echo off
echo ChefMate Print Server - Windows Only Build
echo ==========================================
echo.

echo Installing dependencies...
npm install

echo.
echo Building Windows portable package...
npm run package:portable

echo.
echo Windows package complete! Check the 'dist' folder.
pause
