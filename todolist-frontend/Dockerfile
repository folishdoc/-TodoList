# === Stage 1: Build Vue frontend ===
FROM node:22-alpine AS builder

ARG VITE_PERSONAL_TOKEN
ENV VITE_PERSONAL_TOKEN=$VITE_PERSONAL_TOKEN

WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# === Stage 2: Serve with nginx ===
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /build/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
