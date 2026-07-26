#!/bin/bash
set -e

# ===================== 配置 =====================
# 飞牛 NAS 连接信息
NAS_USER="root"                    # NAS SSH 用户名
NAS_HOST="192.168.x.x"             # NAS IP 或域名
NAS_DIR="/volume1/docker/todolist"  # NAS 部署目录（根据你的存储卷修改）

# 部署需要本地构建，然后上传到 NAS
# ================================================

echo "===== 1. 构建后端 ====="
./mvnw package -DskipTests -q

echo "===== 2. 构建前端 ====="
cd todolist-frontend
npm ci --silent
# 从 .env 读取 PERSONAL_TOKEN 注入前端构建
if [ -f "../.env" ]; then
  source "../.env"
  VITE_PERSONAL_TOKEN=$PERSONAL_TOKEN npx vite build --logLevel error
else
  npx vite build --logLevel error
fi
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
cp .env deploy-tmp/
cp init.sql deploy-tmp/

echo "===== 4. 上传到飞牛 NAS ====="
ssh $NAS_USER@$NAS_HOST "mkdir -p $NAS_DIR"
scp deploy-tmp/app.jar           $NAS_USER@$NAS_HOST:$NAS_DIR/
scp -r deploy-tmp/dist           $NAS_USER@$NAS_HOST:$NAS_DIR/
scp deploy-tmp/nginx.conf        $NAS_USER@$NAS_HOST:$NAS_DIR/
scp deploy-tmp/docker-compose.yml $NAS_USER@$NAS_HOST:$NAS_DIR/
scp deploy-tmp/.env              $NAS_USER@$NAS_HOST:$NAS_DIR/
scp deploy-tmp/init.sql          $NAS_USER@$NAS_HOST:$NAS_DIR/

echo "===== 5. 首次申请 SSL 证书 ====="
ssh $NAS_USER@$NAS_HOST "
  cd $NAS_DIR
  # 启动 nginx（临时，仅用于 certbot 验证）
  docker compose up -d frontend
  echo '等待 nginx 启动...'
  sleep 5

  # 申请 Let's Encrypt 证书
  docker compose run --rm certbot certonly --webroot \
    --webroot-path /var/www/certbot \
    --email \$SSL_EMAIL \
    --agree-tos \
    --no-eff-email \
    -d \$DOMAIN_NAME

  # 完整启动所有服务
  docker compose up -d
"

echo "===== 部署完成 ====="
echo "访问 https://\$DOMAIN_NAME 即可使用"

# 清理本地临时文件
rm -rf deploy-tmp
