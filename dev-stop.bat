@echo off
chcp 65001 >nul
echo ========================================
echo   Todolist - Stop All Services
echo ========================================
echo.

taskkill /F /IM todolist.exe >nul 2>&1
if errorlevel 1 (echo [-] Tauri not running) else (echo [OK] Tauri stopped)

taskkill /F /IM java.exe >nul 2>&1
if errorlevel 1 (echo [-] Java not running) else (echo [OK] Java stopped)

taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (echo [-] Node not running) else (echo [OK] Node stopped)

echo.
echo All services stopped.
pause
