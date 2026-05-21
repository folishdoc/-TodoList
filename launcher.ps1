# TodoList One-Click Launcher (PowerShell)
# Double-click or run: .\launcher.ps1
# If execution policy blocks it, run: powershell -ExecutionPolicy Bypass -File .\launcher.ps1

param([string]$Action = "")

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPort = 8080
$frontendPort = 5173
$backendLog = "$scriptDir\backend.log"
$frontendLog = "$scriptDir\frontend.log"

$cyan = "Cyan"
$green = "Green"
$yellow = "Yellow"
$red = "Red"
$white = "White"
$gray = "Gray"

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor $cyan
    Write-Host "  ║        TodoList Application Manager       ║" -ForegroundColor $cyan
    Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor $cyan
    Write-Host ""
}

function Test-Port([int]$port) {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
    try {
        $listener.Start()
        $listener.Stop()
        return $false
    } catch {
        return $true
    }
}

function Test-Prerequisites {
    $allOk = $true

    if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
        Write-Host "  [FAIL] Java not found. Please install JDK 17+" -ForegroundColor $red
        $allOk = $false
    } else {
        $javaVer = (java -version 2>&1 | Select-Object -First 1)
        Write-Host "  [OK]   $javaVer" -ForegroundColor $green
    }

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "  [FAIL] Node.js not found. Please install Node.js" -ForegroundColor $red
        $allOk = $false
    } else {
        $nodeVer = (node --version)
        Write-Host "  [OK]   Node.js $nodeVer" -ForegroundColor $green
    }

    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Host "  [FAIL] npm not found" -ForegroundColor $red
        $allOk = $false
    } else {
        $npmVer = (npm --version)
        Write-Host "  [OK]   npm v$npmVer" -ForegroundColor $green
    }

    if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
        Write-Host "  [WARN] MySQL CLI not found. Make sure MySQL is running." -ForegroundColor $yellow
    }

    return $allOk
}

function Start-Backend {
    if (Test-Port $backendPort) {
        Write-Host "  [INFO] Backend already running on port $backendPort" -ForegroundColor $yellow
        return $true
    }

    Write-Host "  Starting backend (port $backendPort)..." -ForegroundColor $yellow
    $proc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; Write-Host 'Backend server running...' -ForegroundColor Green; .\mvnw.cmd spring-boot:run" -WindowStyle Minimized -PassThru
    $proc.Id | Out-File "$scriptDir\.backend.pid"

    Write-Host "  Waiting for backend..." -ForegroundColor $gray
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 2
        if (Test-Port $backendPort) {
            Write-Host "  [OK]   Backend started successfully" -ForegroundColor $green
            return $true
        }
    }
    Write-Host "  [WARN] Backend may still be starting. Check http://localhost:$backendPort" -ForegroundColor $yellow
    return $true
}

function Start-Frontend {
    if (Test-Port $frontendPort) {
        Write-Host "  [INFO] Frontend already running on port $frontendPort" -ForegroundColor $yellow
        return $true
    }

    if (-not (Test-Path "$scriptDir\todolist-frontend\node_modules")) {
        Write-Host "  Installing frontend dependencies..." -ForegroundColor $yellow
        Push-Location "$scriptDir\todolist-frontend"
        npm install 2>&1 | Out-Null
        Pop-Location
    }

    Write-Host "  Starting frontend (port $frontendPort)..." -ForegroundColor $yellow
    $proc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\todolist-frontend'; Write-Host 'Frontend server running...' -ForegroundColor Green; npm run dev" -WindowStyle Minimized -PassThru
    $proc.Id | Out-File "$scriptDir\.frontend.pid"

    Write-Host "  Waiting for frontend..." -ForegroundColor $gray
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 2
        if (Test-Port $frontendPort) {
            Write-Host "  [OK]   Frontend started successfully" -ForegroundColor $green
            return $true
        }
    }
    Write-Host "  [WARN] Frontend may still be starting. Check http://localhost:$frontendPort" -ForegroundColor $yellow
    return $true
}

function Stop-Backend {
    Write-Host "  Stopping backend..." -ForegroundColor $yellow
    $stopped = $false
    $javaProcs = Get-Process java -ErrorAction SilentlyContinue
    if ($javaProcs) {
        foreach ($p in $javaProcs) {
            try {
                $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($p.Id)").CommandLine
                if ($cmd -like "*todolist*") {
                    Stop-Process -Id $p.Id -Force
                    Write-Host "  [OK]   Backend stopped (PID $($p.Id))" -ForegroundColor $green
                    $stopped = $true
                }
            } catch {}
        }
    }
    if (-not $stopped) {
        Write-Host "  [INFO] No backend process found" -ForegroundColor $gray
    }
    Remove-Item "$scriptDir\.backend.pid" -ErrorAction SilentlyContinue
}

function Stop-Frontend {
    Write-Host "  Stopping frontend..." -ForegroundColor $yellow
    $stopped = $false
    $nodeProcs = Get-Process node -ErrorAction SilentlyContinue
    if ($nodeProcs) {
        foreach ($p in $nodeProcs) {
            try {
                $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId = $($p.Id)").CommandLine
                if ($cmd -like "*vite*") {
                    Stop-Process -Id $p.Id -Force
                    Write-Host "  [OK]   Frontend stopped (PID $($p.Id))" -ForegroundColor $green
                    $stopped = $true
                }
            } catch {}
        }
    }
    if (-not $stopped) {
        Write-Host "  [INFO] No frontend process found" -ForegroundColor $gray
    }
    Remove-Item "$scriptDir\.frontend.pid" -ErrorAction SilentlyContinue
}

function Show-Status {
    Write-Host ""
    Write-Host "  Service Status:" -ForegroundColor $cyan
    Write-Host "  ─────────────────────────────────────────" -ForegroundColor $gray

    if (Test-Port $backendPort) {
        Write-Host "  Backend  (port $backendPort) : Running" -ForegroundColor $green
    } else {
        Write-Host "  Backend  (port $backendPort) : Stopped" -ForegroundColor $red
    }

    if (Test-Port $frontendPort) {
        Write-Host "  Frontend (port $frontendPort) : Running" -ForegroundColor $green
    } else {
        Write-Host "  Frontend (port $frontendPort) : Stopped" -ForegroundColor $red
    }

    Write-Host ""
    Write-Host "  URLs:" -ForegroundColor $gray
    Write-Host "    Backend API:  http://localhost:$backendPort" -ForegroundColor $white
    Write-Host "    Swagger UI:   http://localhost:$backendPort/swagger-ui.html" -ForegroundColor $white
    Write-Host "    Frontend App: http://localhost:$frontendPort" -ForegroundColor $white
    Write-Host ""
}

function Start-All {
    Write-Banner
    Write-Host "  Checking prerequisites..." -ForegroundColor $cyan
    Write-Host ""
    if (-not (Test-Prerequisites)) {
        Write-Host ""
        Write-Host "  Please fix the issues above and try again." -ForegroundColor $red
        Pause
        return
    }
    Write-Host ""
    Write-Host "  Starting services..." -ForegroundColor $cyan
    Write-Host ""
    Start-Backend
    Write-Host ""
    Start-Frontend
    Write-Host ""
    Show-Status

    Write-Host "  Opening browser..." -ForegroundColor $yellow
    Start-Process "http://localhost:$frontendPort"

    Write-Host "  Press any key to return to menu..." -ForegroundColor $gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Show-Menu
}

function Stop-All {
    Write-Banner
    Write-Host "  Stopping all services..." -ForegroundColor $cyan
    Write-Host ""
    Stop-Backend
    Stop-Frontend
    Write-Host ""
    Write-Host "  All services stopped." -ForegroundColor $green
    Write-Host ""
    Write-Host "  Press any key to return to menu..." -ForegroundColor $gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Show-Menu
}

function Restart-All {
    Write-Banner
    Write-Host "  Restarting services..." -ForegroundColor $cyan
    Write-Host ""
    Stop-Backend
    Stop-Frontend
    Write-Host ""
    Start-Sleep -Seconds 3
    Start-Backend
    Write-Host ""
    Start-Frontend
    Write-Host ""
    Show-Status

    Write-Host "  Opening browser..." -ForegroundColor $yellow
    Start-Process "http://localhost:$frontendPort"

    Write-Host "  Press any key to return to menu..." -ForegroundColor $gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Show-Menu
}

function Show-Menu {
    Write-Banner
    Show-Status
    Write-Host "  [1] Start All" -ForegroundColor $green
    Write-Host "  [2] Stop All" -ForegroundColor $red
    Write-Host "  [3] Restart All" -ForegroundColor $yellow
    Write-Host "  [4] Open Frontend" -ForegroundColor $cyan
    Write-Host "  [5] Open Swagger UI" -ForegroundColor $cyan
    Write-Host "  [0] Exit" -ForegroundColor $gray
    Write-Host ""
    $choice = Read-Host "  Enter your choice"

    switch ($choice) {
        "1" { Start-All }
        "2" { Stop-All }
        "3" { Restart-All }
        "4" { Start-Process "http://localhost:$frontendPort"; Show-Menu }
        "5" { Start-Process "http://localhost:$backendPort/swagger-ui.html"; Show-Menu }
        "0" { Write-Host "Goodbye!" -ForegroundColor $cyan; exit 0 }
        default { Show-Menu }
    }
}

# Entry point
if ($Action -eq "start") {
    Start-All
} elseif ($Action -eq "stop") {
    Stop-All
} elseif ($Action -eq "restart") {
    Restart-All
} else {
    Show-Menu
}
