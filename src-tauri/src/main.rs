#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command};
use std::sync::Mutex;

struct Backend(Mutex<Option<Child>>);

fn start_backend() -> Option<Child> {
    Command::new("jre/bin/java")
        .args(["-jar", "backend.jar"])
        .spawn()
        .ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let backend = start_backend();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Backend(Mutex::new(backend)))
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // 关闭窗口时最小化到托盘，不退出
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("启动失败")
        .run(|_app, _event| {});
}

fn main() {
    run();
}
