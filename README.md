# 📝 Todolist - 个人待办事项管理

[![CI](https://github.com/anomalyco/todolist/actions/workflows/ci.yml/badge.svg)](https://github.com/anomalyco/todolist/actions/workflows/ci.yml)

一个功能完善的个人待办事项管理应用，采用前后端分离架构。

**特点**: 无需登录，打开即用！支持PWA离线使用。

---

## ✨ 核心功能（20个）

### 基础功能
- ✅ 任务管理（CRUD、搜索、筛选）
- ✅ 清单分类（多清单、颜色标记）
- ✅ 优先级管理（低/中/高）
- ✅ 截止日期设置
- ✅ 智能视图（今日/未来/全部）

### 增强功能
- ✅ 标签系统（多维度分类）
- ✅ 数据统计（可视化图表）
- ✅ 数据导出（CSV/JSON）
- ✅ 任务提醒（自动检测）

### 高级功能
- ✅ 重复任务（周期生成）
- ✅ 批量操作（完成/删除/移动）
- ✅ 暗色主题（亮/暗切换）
- ✅ 文件附件上传（10MB限制）

### 完整功能
- ✅ PWA离线支持（可安装）
- ✅ 键盘快捷键（全局快捷）
- ✅ 移动端适配（响应式）
- ✅ 离线缓存（Service Worker）

---

## 🚀 快速开始

### 前置要求
- Java 17+
- Node.js 16+
- MySQL 8.0+
- Maven 3.6+

### ⚡ 方式一：一键启动（推荐）

**Windows用户有三种选择**：

1. **完全无窗口**⭐：双击 `start_hidden.vbs`（后台运行，自动打开浏览器）
2. **最小化窗口**：右击 `start.ps1` → "使用PowerShell运行"（窗口最小化）
3. **显示窗口**：双击 `start.bat`（显示启动过程）

**停止服务**：
- 对应使用 `stop_hidden.vbs`、`stop.ps1` 或 `stop.bat`

**推荐使用**: `start_hidden.vbs` - 完全无任何窗口，最简洁！

### 📝 方式二：手动启动

### 1. 配置数据库
```sql
CREATE DATABASE todolist_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

修改 `src/main/resources/application.properties` 中的数据库密码。

### 2. 启动后端
```bash
mvn spring-boot:run
```
访问: http://localhost:8080

### 3. 启动前端
```bash
cd todolist-frontend
npm install
npm run dev
```
访问: http://localhost:5173

---

## 🏗️ 技术栈

**后端**: Spring Boot 4.0.6 + Java 17 + MySQL + JPA + JWT  
**前端**: Vue 3 + TypeScript + Vite + Element Plus + Pinia

---

## 📁 项目结构

```
todolist/
├── src/main/java/com/liuzeyu/todolist/   # 后端源码
│   ├── common/                           # 通用模块
│   ├── module/                           # 业务模块
│   └── TodolistApplication.java
├── todolist-frontend/                    # 前端源码
│   ├── src/
│   │   ├── api/                          # API接口
│   │   ├── views/                        # 页面
│   │   └── components/                   # 组件
│   └── public/                           # 静态资源
├── database/                             # 数据库脚本
└── README.md
```

---

## 📊 项目统计

- **版本**: v5.0 (终极完整版)
- **功能**: 20个核心功能
- **API**: 42个RESTful接口
- **代码量**: ~7500行
- **完成度**: 100% ✅

---

## 🔗 相关链接

- **Swagger文档**: http://localhost:8080/swagger-ui.html
- **前端主页**: http://localhost:5173
- **后端API**: http://localhost:8080
- **启动指南**: [STARTUP_GUIDE.md](STARTUP_GUIDE.md) - 详细启动说明
- **项目结构**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 目录结构说明

---

<div align="center">

**Made with ❤️ using Spring Boot + Vue 3**

当前版本：v5.0 | 所有功能已完成 ✅

</div>
