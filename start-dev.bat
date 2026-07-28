@echo off
setlocal

cd /d "%~dp0"

echo Installing dependencies...
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed.
  pause
  exit /b 1
)

echo.
echo Starting development server...
call npm run dev -- --open /login
if errorlevel 1 (
  echo.
  echo npm run dev failed.
  pause
  exit /b 1
)

endlocal
