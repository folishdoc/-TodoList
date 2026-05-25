@echo off
chcp 65001 >nul
echo ==========================================
echo   Todolist Windows 桌面版 — 构建脚本
echo ==========================================
echo.

set ROOT=%~dp0

:: Step 1: 前端编译
echo [1/4] 编译前端...
cd /d "%ROOT%todolist-frontend"
call npm run build
if %ERRORLEVEL% neq 0 ( echo 前端编译失败！ && exit /b 1 )

:: 复制前端产物到 Spring Boot 静态资源目录
echo 复制前端文件到后端...
if exist "%ROOT%src\main\resources\static\" rmdir /s /q "%ROOT%src\main\resources\static"
xcopy /e /i /q "%ROOT%todolist-frontend\dist" "%ROOT%src\main\resources\static"

:: Step 2: 后端打包
echo [2/4] 打包后端...
cd /d "%ROOT%"
call mvnw package -DskipTests
if %ERRORLEVEL% neq 0 ( echo 后端打包失败！ && exit /b 1 )

:: 复制 fat JAR
copy /y "%ROOT%target\todolist-0.0.1-SNAPSHOT.jar" "%ROOT%src-tauri\backend.jar"

:: Step 3: 裁剪 JRE（需要 jlink）
echo [3/4] 裁剪 JRE...
if exist "%ROOT%src-tauri\jre" rmdir /s /q "%ROOT%src-tauri\jre"
jlink --add-modules java.base,java.sql,java.naming,java.management,java.instrument,java.desktop,java.security.jgss --output "%ROOT%src-tauri\jre" --strip-debug --no-man-pages --no-header-files
if %ERRORLEVEL% neq 0 ( echo JRE 裁剪失败！请确保 JDK 17+ 已安装 && exit /b 1 )

:: Step 4: Tauri 打包（需要安装 Rust + Tauri CLI）
echo [4/4] 打包 Tauri...
cd /d "%ROOT%src-tauri"
cargo tauri build
if %ERRORLEVEL% neq 0 ( echo Tauri 打包失败！请确保已安装 Rust 和 Tauri CLI && exit /b 1 )

echo.
echo ==========================================
echo   构建完成！
echo   安装包位置：src-tauri\target\release\bundle\nsis\
echo ==========================================
pause
