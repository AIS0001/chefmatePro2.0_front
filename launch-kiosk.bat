@echo off
REM ChefMate KIOSK Launcher - Fullscreen Mode
REM This script launches Chrome in kiosk mode for the ChefMate KIOSK page

echo ========================================
echo   ChefMate KIOSK Launcher
echo ========================================
echo.
echo Starting KIOSK in fullscreen mode...
echo.
echo To exit fullscreen, press Alt+F4
echo ========================================

REM Launch Chrome in kiosk mode
REM Update the URL if your app runs on a different port or domain
start chrome.exe --kiosk "http://localhost:3000/kiosk" --no-first-run --disable-session-crashed-bubble --disable-infobars

REM Alternative: Launch in app mode (borderless window, not fullscreen)
REM start chrome.exe --app="http://localhost:3000/kiosk" --no-first-run

echo.
echo KIOSK launched successfully!
echo.
pause
