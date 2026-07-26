# Todolist Windows 桌面应用 — 设计文档

**日期：** 2026-05-25  
**版本：** v1.0  
**状态：** 设计完成，待实施  

---

## 1. 目标

将现有的 Todolist Web 应用（Spring Boot + Vue 3）转换为功能齐全的 Windows 桌面软件：
- 双击 EXE 即可运行，无需安装 MySQL 或浏览器
- 系统托盘常驻，最小化不退出
- 原生 Windows 通知
- 支持开机自启
- NSIS 打包为 `.exe` 安装包

---

## 2. 技术方案

### 2.1 整体架构

```
todolist.exe (NSIS 安装)
├── todolist.exe          ← Tauri 外壳 (Rust, ~5MB)
├── jre/                  ← jlink 定制 JRE (~40MB)
├── backend.jar           ← Spring Boot 胖 JAR (~30MB)
└── resources/            ← Vue 3 编译产物
```

### 2.2 运行流程

1. 用户双击 `todolist.exe`
2. Tauri 启动 `jre/bin/java -jar backend.jar`
3. 后端启动 H2 数据库，监听 `localhost:18080`
4. Tauri 检测后端就绪，WebView2 加载 `http://localhost:18080`
5. 关闭窗口 → 最小化到系统托盘
6. 托盘右键"退出" → 终止 Java 进程 → 退出

### 2.3 数据库：MySQL → H2

替换为 H2 嵌入式数据库，文件存储在 `%APPDATA%/Todolist/data/todolist_db.mv.db`。

### 2.4 桌面框架：Tauri

- Rust 外壳提供：原生窗口、系统托盘、通知、开机自启
- WebView2 渲染 Vue 3 前端（Windows 10+ 自带 WebView2 Runtime）
- Spring Boot 作为 sidecar 子进程

---

## 3. 改动清单

### 3.1 新增文件

| 路径 | 说明 |
|------|------|
| `src-tauri/tauri.conf.json` | Tauri 窗口/安全/打包配置 |
| `src-tauri/src/main.rs` | Rust 启动逻辑（启动 Java、托盘、生命周期） |
| `src-tauri/Cargo.toml` | Rust 依赖 |
| `src-tauri/icons/` | 应用图标 |
| `build/windows/installer.nsi` | NSIS 安装脚本 |

### 3.2 后端改动（3 个文件）

| 文件 | 改动 |
|------|------|
| `pom.xml` | 添加 H2 依赖 |
| `src/main/resources/application.properties` | 切换 H2 数据源，端口固定 18080 |

### 3.3 前端改动（4 个文件）

| 文件 | 改动 |
|------|------|
| `todolist-frontend/src/utils/request.ts` | baseURL → `localhost:18080` |
| `todolist-frontend/src/router/index.ts` | history → hash 模式 |
| `todolist-frontend/vite.config.ts` | base → `./` |
| `todolist-frontend/src/views/Dashboard.vue` | 附件下载链接从 baseURL 读取 |

---

## 4. 数据存储

```
%LOCALAPPDATA%/Todolist/
├── data/todolist_db.mv.db    ← H2 数据库
├── uploads/                   ← 附件文件
├── logs/                      ← 运行日志
└── config.properties          ← 用户设置
```

---

## 5. 系统集成

| 功能 | 实现方式 |
|------|----------|
| 系统托盘 | Tauri `tray-icon` feature，左键显隐窗口，右键退出 |
| 原生通知 | Tauri notification API 发送纪念日提醒 |
| 开机自启 | NSIS 安装脚本写入注册表 `Run` 键 + 安装界面勾选框 |
| 文件关联 | 后续版本支持 `.todo` 文件关联 |

---

## 6. 构建与打包

```bash
# 1. 前端
cd todolist-frontend && npm run build

# 2. 后端
./mvnw package -DskipTests

# 3. 定制 JRE
jlink --add-modules java.base,java.sql,java.naming,java.management,java.instrument,java.security.jgss,java.xml --output jre

# 4. Tauri + NSIS
cd src-tauri && cargo tauri build --target x86_64-pc-windows-msvc
```

输出：`target/release/bundle/nsis/Todolist_1.0.0_x64-setup.exe` (~80MB)

---

## 7. 不做的事项

- 自动更新（第一版不实现，后续可加 Tauri updater）
- 数据云同步
- 多用户支持
- macOS/Linux 跨平台
