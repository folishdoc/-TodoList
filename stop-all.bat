@echo off
setlocal
echo.
echo   ============================================
echo     Stopping TodoList Application
echo   ============================================
echo.
echo   Stopping frontend...
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "node" 2^>nul') do (
    wmic process where processid=%%i get commandline 2>nul | findstr /i "vite" >nul
    if not errorlevel 1 (
        taskkill /F /PID %%i >nul 2>&1
        echo   [OK] Frontend stopped (PID %%i)
    )
)
echo.
echo   Stopping backend...
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "java" 2^>nul') do (
    wmic process where processid=%%i get commandline 2>nul | findstr /i "todolist" >nul
    if not errorlevel 1 (
        taskkill /F /PID %%i >nul 2>&1
        echo   [OK] Backend stopped (PID %%i)
    )
)
echo.
echo   Done!
pause
endlocal
