# === Stage 1: Build with Maven ===
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build
COPY pom.xml .
COPY src ./src

# 跳过测试以加速构建（生产构建不需要跑单元测试）
RUN mvn package -DskipTests -q

# === Stage 2: Run with JRE ===
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar

# H2 数据目录
VOLUME /app/data

EXPOSE 18080

ENTRYPOINT ["java", "-jar", "app.jar"]
