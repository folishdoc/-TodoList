@echo off
chcp 65001 >nul
set "ROOT=%~dp0"
echo ========================================
echo   Todolist Dev Environment
echo ========================================
echo.

echo [1/3] Starting Java backend...
start "Todolist-Backend" /D "%ROOT%." cmd /c "mvnw spring-boot:run"

echo [2/3] Starting Vite frontend...
start "Todolist-Vite" /D "%ROOT%todolist-frontend" cmd /c "npm run dev"

echo [3/3] Starting Tauri desktop...
start "Todolist-Tauri" /D "%ROOT%src-tauri" cmd /c "cargo tauri dev"

echo.
echo ========================================
echo   Waiting for build to complete...
echo   Run dev-stop.bat to stop all services
echo ========================================
pause
