# Todolist Windows 桌面应用 — 设计文档

**日期：** 2026-05-25  
**版本：** v1.0  

---

## 1. 目标

将现有的 Todolist Web 应用（Spring Boot + Vue 3）转换为 Windows 桌面软件：
- 双击 EXE 即可运行，不需要装 MySQL 或打开浏览器
- 系统托盘常驻，关闭窗口不退出
- 原生 Windows 通知
- 开机自启
- NSIS 打包为 `.exe` 安装包

---

## 2. 技术选型

| 项 | 选择 | 原因 |
|----|------|------|
| 桌面框架 | Tauri (Rust) | 体积小(~5MB)，用系统 WebView2，系统集成好 |
| 数据库 | H2 嵌入式 | 替换 MySQL，数据存本地文件，JPA 改动最小 |
| 打包 | NSIS .exe | 不需要管理员权限，装到用户目录 |
| JRE | jlink 定制 | 只含必要模块，约 40MB |

---

## 3. 整体架构

```
Todolist-Setup-1.0.0.exe (安装包, ~80MB)
│
└── 安装到 %LOCALAPPDATA%\Todolist\
    ├── todolist.exe          ← Tauri 外壳
    ├── jre\                  ← 定制 JRE
    ├── backend.jar           ← Spring Boot 胖 JAR
    └── resources\            ← Vue 编译产物
```

### 运行流程

1. 双击 `todolist.exe`
2. Tauri 启动 `jre/bin/java -jar backend.jar`
3. 后端启动 H2 数据库，监听 `localhost:18080`
4. Tauri 检测后端就绪，WebView2 加载 `http://localhost:18080`
5. 关闭窗口 → 最小化到托盘（不退出）
6. 托盘右键"退出" → 关闭 Java 进程 → 退出

### 数据存储

```
%APPDATA%\Todolist\
├── data\todolist_db.mv.db    ← H2 数据库文件
├── uploads\                   ← 任务附件
└── logs\                      ← 应用日志
```

---

## 4. 改动清单

### 后端（2 个文件）

**pom.xml** — 添加 H2 依赖：
```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>runtime</scope>
</dependency>
```

**application.properties** — 切换数据库和端口：
```properties
# MySQL 相关配置全部替换为：
spring.datasource.url=jdbc:h2:file:./data/todolist_db
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
server.port=18080
file.upload.dir=./uploads
```

### 前端（4 个文件，每文件改 1 行）

| 文件 | 改动 |
|------|------|
| `src/utils/request.ts` | baseURL → `http://localhost:18080/api` |
| `src/router/index.ts` | `createWebHistory()` → `createWebHashHistory()` |
| `vite.config.ts` | 添加 `base: './'` |
| `src/views/Dashboard.vue` | 附件下载链接从 request.ts 的 baseURL 获取 |

### 新增 Tauri 项目（3 个核心文件）

**src-tauri/tauri.conf.json** — 窗口、安全、打包配置  
**src-tauri/src/main.rs** — 启动 Java 子进程、托盘、生命周期  
**src-tauri/Cargo.toml** — Rust 依赖

---

## 5. 系统功能

| 功能 | 实现 |
|------|------|
| 系统托盘 | 左键显隐窗口，右键菜单（显示/退出） |
| 通知 | 纪念日提醒 → Windows 原生 toast |
| 开机自启 | NSIS 安装脚本写注册表 Run 键 |
| 窗口图标 | 自定义 ico 文件 |

---

## 6. 构建步骤

```bash
# 1. 前端编译
cd todolist-frontend && npm run build

# 2. 后端打包
mvnw package -DskipTests

# 3. 定制 JRE
jlink --add-modules java.base,java.sql,java.naming,java.management,java.instrument --output jre

# 4. Tauri + NSIS 打包
cd src-tauri && cargo tauri build
```

输出：`todolist_1.0.0_x64-setup.exe`

---

## 7. 实施顺序

1. 后端 H2 切换 → 验证启动正常
2. 前端适配 → 验证 build 正常
3. Tauri 外壳搭建 → 验证 cargo tauri dev 正常
4. 系统托盘 + 通知
5. JRE 裁剪 + 打包脚本
6. 完整构建测试
