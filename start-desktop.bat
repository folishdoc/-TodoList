@echo off
chcp 65001 >nul
title Todolist - 个人待办事项管理
set ROOT=%~dp0

echo 正在启动 Todolist...
echo.

:: 检查 Java
where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 错误：未找到 Java，请安装 JDK 17+
    pause
    exit /b 1
)

:: 启动后端
echo 启动后端服务...
start "Todolist-Backend" /MIN javaw -jar "%ROOT%target\todolist-0.0.1-SNAPSHOT.jar"

:: 等待后端就绪
echo 等待服务就绪...
:wait
timeout /t 1 /nobreak >nul
curl -s http://localhost:18080/api/tasks >nul 2>&1
if %ERRORLEVEL% neq 0 goto wait

:: 打开前端
echo 启动完成！
start http://localhost:18080

echo.
echo Todolist 已启动。关闭后端窗口即可退出。
exit
