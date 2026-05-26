#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::Manager;

struct Backend(Mutex<Option<Child>>);

fn exe_dir() -> PathBuf {
    env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
}

fn find_java() -> Option<String> {
    // 1. JAVA_HOME 环境变量
    if let Ok(java_home) = env::var("JAVA_HOME") {
        let java_exe = PathBuf::from(&java_home).join("bin").join("java.exe");
        if java_exe.exists() {
            println!("使用 JAVA_HOME: {}", java_exe.display());
            return Some(java_exe.to_string_lossy().to_string());
        }
    }

    // 2. 捆绑的 JRE（相对于 exe 目录）
    let bundled_java = exe_dir().join("jre").join("bin").join("java.exe");
    if bundled_java.exists() {
        println!("使用捆绑 JRE: {}", bundled_java.display());
        return Some(bundled_java.to_string_lossy().to_string());
    }

    // 3. 系统 PATH 中的 java（检查版本）
    if let Ok(output) = Command::new("java").arg("-version").output() {
        let version_str = String::from_utf8_lossy(&output.stderr);
        println!("PATH 中 Java 版本: {}", version_str.lines().next().unwrap_or("unknown"));
        return Some("java".to_string());
    }

    None
}

fn find_backend_jar() -> Option<String> {
    let base = exe_dir();

    // NSIS 安装后，backend.jar 在 exe 同目录（bundle.resources）
    let candidates: Vec<PathBuf> = vec![
        base.join("backend.jar"),
        base.join("..").join("backend.jar"),
        base.join("target").join("todolist-0.0.1-SNAPSHOT.jar"),
        // 开发时从 src-tauri 目录运行
        PathBuf::from("backend.jar"),
    ];

    for path in &candidates {
        if path.exists() {
            println!("找到后端 JAR: {}", path.display());
            return Some(path.to_string_lossy().to_string());
        }
    }
    eprintln!("未找到 backend.jar，搜索路径:");
    for path in &candidates {
        eprintln!("  {}", path.display());
    }
    None
}

fn start_backend() -> Option<Child> {
    let java = find_java()?;
    let jar = find_backend_jar()?;
    println!("启动后端: {} -jar {}", java, jar);
    Command::new(&java)
        .args(["-jar", &jar])
        .current_dir(exe_dir())
        .spawn()
        .map_err(|e| eprintln!("启动后端失败: {}", e))
        .ok()
}

fn wait_for_backend() -> bool {
    for i in 0..30 {
        match reqwest::blocking::get("http://localhost:18080/") {
            Ok(resp) if resp.status().is_success() => {
                println!("后端就绪 (第{}次尝试)", i + 1);
                return true;
            }
            Ok(resp) => {
                println!("后端响应但状态异常: {} (第{}次尝试)", resp.status(), i + 1);
            }
            Err(_) => {
                // 后端尚未就绪
            }
        }
        thread::sleep(Duration::from_secs(1));
    }
    eprintln!("后端启动超时（30秒）");
    false
}

fn main() {
    let backend = start_backend();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Backend(Mutex::new(backend)))
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let _ = window.hide();
            }
        })
        .setup(|_app| {
            // 启动后端进程，loader.js 会轮询并跳转
            thread::spawn(|| {
                if !wait_for_backend() {
                    eprintln!("后端启动失败，请确认 Java 17+ 已安装");
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                let state = app.state::<Backend>();
                if let Ok(mut guard) = state.0.lock() {
                    if let Some(ref mut child) = *guard {
                        let _ = child.kill();
                    }
                }
                app.exit(0);
            }
        });
}
