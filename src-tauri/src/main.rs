#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;

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

fn clear_webview_cache() {
    let local_app_data = env::var("LOCALAPPDATA").unwrap_or_default();
    let data_dir = PathBuf::from(&local_app_data).join("com.todolist.app");
    if data_dir.exists() {
        let _ = std::fs::remove_dir_all(&data_dir);
    }
}

fn main() {
    clear_webview_cache();
    let backend = start_backend();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Backend(Mutex::new(backend)))
        .setup(|app| {
            let show_item = MenuItemBuilder::with_id("show", "打开清单").build(app)?;
            let widget_item = MenuItemBuilder::with_id("widget", "打开小组件").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "退出").build(app)?;
            let menu = MenuBuilder::new(app)
                .item(&show_item)
                .item(&widget_item)
                .item(&quit_item)
                .build()?;

            let icon = app.default_window_icon().cloned().unwrap();
            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "widget" => {
                            if let Some(w) = app.get_webview_window("widget") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "quit" => {
                            if let Ok(mut guard) = app.state::<Backend>().0.lock() {
                                if let Some(ref mut child) = *guard {
                                    let _ = child.kill();
                                }
                            }
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let label = window.label().to_string();
                if label == "main" || label == "widget" {
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, _event| {});
}
