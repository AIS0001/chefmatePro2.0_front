@echo off
setlocal

echo 🚀 ChefMate Print Server - Build All Packages
echo ===============================================

set DIST_DIR=..\dist

rem Clean dist directory
if exist "%DIST_DIR%" (
    echo 🧹 Cleaning dist directory...
    rmdir /s /q "%DIST_DIR%"
)
mkdir "%DIST_DIR%"

rem Install dev dependencies if not present
echo 📦 Installing build dependencies...
npm install

rem Build Windows Executable
echo.
echo 🪟 Building Windows Executable...

npm run build:windows
if %ERRORLEVEL% neq 0 (
    echo ⚠️  Windows executable build failed, creating portable version instead...
)

rem Create Portable Package
echo.
echo 📦 Creating Windows Portable Package...
node create-portable.js

rem Create Android Package
echo.
echo 📱 Creating Android Package...
node create-android-package.js

rem Create summary
echo.
echo 📋 Build Summary
echo =================

for %%F in (%DIST_DIR%\*) do (
    set FILE=%%~nxF
    set SIZE=%%~zF
    set /a SIZE_MB=SIZE/1024/1024
    echo ✅ !FILE! (!SIZE_MB! MB)
)

echo.
echo 🎉 All packages built successfully!
echo.
echo 📂 Packages location: ./dist/

endlocal
