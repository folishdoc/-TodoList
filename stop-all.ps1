Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "    Stopping TodoList Application" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Stopping frontend..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        if ($cmd -like "*vite*") {
            Stop-Process -Id $_.Id -Force
            Write-Host "  [OK] Frontend stopped (PID $($_.Id))" -ForegroundColor Green
        }
    } catch {}
}

Write-Host ""
Write-Host "  Stopping backend..." -ForegroundColor Yellow
Get-Process java -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
        if ($cmd -like "*todolist*") {
            Stop-Process -Id $_.Id -Force
            Write-Host "  [OK] Backend stopped (PID $($_.Id))" -ForegroundColor Green
        }
    } catch {}
}

Write-Host ""
Write-Host "  Done!" -ForegroundColor Green
pause
