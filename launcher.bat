@echo off
setlocal enabledelayedexpansion

:: TodoList One-Click Launcher (Batch)
:: Double-click to run, or: launcher.bat [start|stop|restart]

set SCRIPT_DIR=%~dp0
set BACKEND_PORT=8080
set FRONTEND_PORT=5173

if not "%1"=="" (
    if /i "%1"=="start" goto :start_all
    if /i "%1"=="stop" goto :stop_all
    if /i "%1"=="restart" goto :restart_all
)

:menu
cls
echo.
echo   ============================================
echo         TodoList Application Manager
echo   ============================================
echo.
call :show_status
echo.
echo   [1] Start All
echo   [2] Stop All
echo   [3] Restart All
echo   [4] Open Frontend
echo   [5] Open Swagger UI
echo   [0] Exit
echo.
set /p choice="  Enter your choice: "

if "%choice%"=="1" goto :start_all
if "%choice%"=="2" goto :stop_all
if "%choice%"=="3" goto :restart_all
if "%choice%"=="4" start http://localhost:%FRONTEND_PORT% & goto :menu
if "%choice%"=="5" start http://localhost:%BACKEND_PORT%/swagger-ui.html & goto :menu
if "%choice%"=="0" goto :eof
goto :menu

:start_all
call :check_prereqs
if %errorlevel% neq 0 (
    pause
    goto :menu
)
echo.
echo   Starting services...
echo.
call :start_backend
echo.
call :start_frontend
echo.
call :show_status
echo.
echo   Opening browser...
start http://localhost:%FRONTEND_PORT%
echo.
echo   Press any key to return to menu...
pause >nul
goto :menu

:stop_all
echo.
echo   Stopping all services...
echo.
call :stop_backend
call :stop_frontend
echo.
echo   All services stopped.
echo.
echo   Press any key to return to menu...
pause >nul
goto :menu

:restart_all
echo.
echo   Restarting services...
echo.
call :stop_backend
call :stop_frontend
timeout /t 3 /nobreak >nul
echo.
call :start_backend
echo.
call :start_frontend
echo.
call :show_status
echo.
echo   Opening browser...
start http://localhost:%FRONTEND_PORT%
echo.
echo   Press any key to return to menu...
pause >nul
goto :menu

:: ---- Helper functions ----

:check_prereqs
echo   Checking prerequisites...
echo.
set HAS_ERROR=0

where java >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] Java not found. Please install JDK 17+
    set HAS_ERROR=1
) else (
    for /f "tokens=*" %%i in ('java -version 2^>^&1 ^| findstr /i "version"') do echo   [OK]   %%i
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] Node.js not found. Please install Node.js
    set HAS_ERROR=1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo   [OK]   Node.js %%i
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo   [FAIL] npm not found
    set HAS_ERROR=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo   [OK]   npm v%%i
)

where mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo   [WARN] MySQL CLI not found. Make sure MySQL is running.
)

exit /b %HAS_ERROR%

:start_backend
:: Check if port is already in use
netstat -ano 2>nul | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo   [INFO] Backend already running on port %BACKEND_PORT%
    exit /b 0
)

echo   Starting backend ^(port %BACKEND_PORT%^)...
start "TodoList Backend" /min cmd /c "cd /d "%SCRIPT_DIR%" && mvnw.cmd spring-boot:run"

echo   Waiting for backend...
for /l %%i in (1,1,30) do (
    timeout /t 2 /nobreak >nul
    netstat -ano 2>nul | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
    if !errorlevel! equ 0 (
        echo   [OK]   Backend started successfully
        exit /b 0
    )
)
echo   [WARN] Backend may still be starting. Check http://localhost:%BACKEND_PORT%
exit /b 0

:start_frontend
:: Check if port is already in use
netstat -ano 2>nul | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo   [INFO] Frontend already running on port %FRONTEND_PORT%
    exit /b 0
)

:: Install dependencies if needed
if not exist "%SCRIPT_DIR%todolist-frontend\node_modules" (
    echo   Installing frontend dependencies...
    cd /d "%SCRIPT_DIR%todolist-frontend"
    call npm install >nul 2>&1
)

echo   Starting frontend ^(port %FRONTEND_PORT%^)...
start "TodoList Frontend" /min cmd /c "cd /d "%SCRIPT_DIR%todolist-frontend" && npm run dev"

echo   Waiting for frontend...
for /l %%i in (1,1,30) do (
    timeout /t 2 /nobreak >nul
    netstat -ano 2>nul | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
    if !errorlevel! equ 0 (
        echo   [OK]   Frontend started successfully
        exit /b 0
    )
)
echo   [WARN] Frontend may still be starting. Check http://localhost:%FRONTEND_PORT%
exit /b 0

:stop_backend
echo   Stopping backend...
set FOUND=0
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "java" 2^>nul') do (
    wmic process where processid=%%i get commandline 2>nul | findstr /i "todolist" >nul
    if not errorlevel 1 (
        taskkill /F /PID %%i >nul 2>&1
        echo   [OK]   Backend stopped ^(PID %%i^)
        set FOUND=1
    )
)
if %FOUND%==0 echo   [INFO] No backend process found
exit /b 0

:stop_frontend
echo   Stopping frontend...
set FOUND=0
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "node" 2^>nul') do (
    wmic process where processid=%%i get commandline 2>nul | findstr /i "vite" >nul
    if not errorlevel 1 (
        taskkill /F /PID %%i >nul 2>&1
        echo   [OK]   Frontend stopped ^(PID %%i^)
        set FOUND=1
    )
)
if %FOUND%==0 echo   [INFO] No frontend process found
exit /b 0

:show_status
echo   Service Status:
echo   --------------------------------------------
netstat -ano 2>nul | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo   Backend  ^(port %BACKEND_PORT%^) : Running
) else (
    echo   Backend  ^(port %BACKEND_PORT%^) : Stopped
)

netstat -ano 2>nul | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo   Frontend ^(port %FRONTEND_PORT%^) : Running
) else (
    echo   Frontend ^(port %FRONTEND_PORT%^) : Stopped
)
echo.
echo   URLs:
echo     Backend API:  http://localhost:%BACKEND_PORT%
echo     Swagger UI:   http://localhost:%BACKEND_PORT%/swagger-ui.html
echo     Frontend App: http://localhost:%FRONTEND_PORT%
exit /b 0

endlocal
