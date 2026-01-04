@echo off
echo Starting ChefMate Print Server (Windows Print Only)...
echo Using printer: 3 CP-Q1UN PINGU
echo.
cd /d "d:\Development\chefMate\chefmate_front\print-server"
node server-windows.js
pause
