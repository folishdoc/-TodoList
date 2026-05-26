#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

struct Backend(Mutex<Option<Child>>);

fn exe_dir() -> PathBuf {
    env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(PathBuf::from))
        .unwrap_or_else(|| PathBuf::from("."))
}

fn find_java() -> Option<PathBuf> {
    if let Ok(java_home) = env::var("JAVA_HOME") {
        let java = PathBuf::from(&java_home).join("bin").join("java.exe");
        if java.exists() {
            return Some(java);
        }
    }
    let bundled = exe_dir().join("jre").join("bin").join("java.exe");
    if bundled.exists() {
        return Some(bundled);
    }
    Some(PathBuf::from("java"))
}

fn find_backend_jar() -> Option<PathBuf> {
    let base = exe_dir();
    for rel in ["backend.jar", "../backend.jar"] {
        let path = base.join(rel);
        if path.exists() {
            return Some(path);
        }
    }
    None
}

fn start_backend() -> Option<Child> {
    let java = find_java()?;
    let jar = find_backend_jar()?;
    Command::new(&java)
        .args(["-jar", &jar.to_string_lossy().to_string()])
        .current_dir(exe_dir())
        .spawn()
        .ok()
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
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                if let Ok(mut guard) = app.state::<Backend>().0.lock() {
                    if let Some(ref mut child) = *guard {
                        let _ = child.kill();
                    }
                }
                app.exit(0);
            }
        });
}
