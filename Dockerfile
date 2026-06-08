# 后端运行镜像（构建产物由 deploy.sh 构建并 scp 到服务器）
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY app.jar app.jar

# H2 数据目录
VOLUME /app/data

EXPOSE 18080

ENTRYPOINT ["java", "-jar", "app.jar"]
