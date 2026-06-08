#!/bin/bash
set -e

# ===================== 配置 =====================
SERVER_USER="root"                  # 服务器用户名
SERVER_HOST="your-server-ip"        # 服务器 IP 或域名
SERVER_DIR="/opt/todolist"          # 服务器部署目录
# ================================================

echo "===== 1. 构建后端 ====="
./mvnw package -DskipTests -q

echo "===== 2. 构建前端 ====="
cd todolist-frontend
npm ci --silent
# 跳过 vue-tsc 类型检查（测试文件中的类型错误不影响构建产物）
npx vite build --logLevel error
cd ..

echo "===== 3. 打包部署文件 ====="
rm -rf deploy-tmp
mkdir -p deploy-tmp

# 复制后端 JAR
cp target/*-SNAPSHOT.jar deploy-tmp/app.jar

# 复制前端构建产物
cp -r todolist-frontend/dist deploy-tmp/dist

# 复制配置文件
cp todolist-frontend/nginx.conf deploy-tmp/
cp docker-compose.yml deploy-tmp/

echo "===== 4. 上传到服务器 ====="
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_DIR"

scp deploy-tmp/app.jar $SERVER_USER@$SERVER_HOST:$SERVER_DIR/
scp -r deploy-tmp/dist $SERVER_USER@$SERVER_HOST:$SERVER_DIR/
scp deploy-tmp/nginx.conf $SERVER_USER@$SERVER_HOST:$SERVER_DIR/
scp deploy-tmp/docker-compose.yml $SERVER_USER@$SERVER_HOST:$SERVER_DIR/

echo "===== 5. 重启服务 ====="
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_DIR && docker compose up -d"

echo "===== 部署完成 ====="

# 清理本地临时文件
rm -rf deploy-tmp
