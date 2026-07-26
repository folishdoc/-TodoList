-- 数据库初始化脚本
-- 注意：Spring Boot JPA ddl-auto=update 会自动创建表结构
-- 此脚本仅用于创建数据库（docker-compose 中已自动创建）和设置字符集

ALTER DATABASE todolist CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
