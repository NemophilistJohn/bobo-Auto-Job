@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24.11+ is required. Install it from https://nodejs.org/
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)
node scripts\launch.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
