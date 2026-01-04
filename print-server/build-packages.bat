@echo off
echo ChefMate Print Server - Package Builder
echo =======================================
echo.

echo Installing dependencies...
npm install

echo.
echo Building all packages...
npm run build

echo.
echo Build complete! Check the 'dist' folder.
pause
