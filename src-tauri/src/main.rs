#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::Manager;

struct Backend(Mutex<Option<Child>>);

fn find_backend_jar() -> Option<String> {
    let candidates = [
        "backend.jar",
        "../backend.jar",
        "target/todolist-0.0.1-SNAPSHOT.jar",
    ];
    for path in candidates {
        if std::path::Path::new(path).exists() {
            return Some(path.to_string());
        }
    }
    None
}

fn start_backend() -> Option<Child> {
    let jar = find_backend_jar()?;
    println!("启动后端: {}", jar);
    Command::new("java").args(["-jar", &jar]).spawn().ok()
}

fn wait_for_backend() -> bool {
    for _ in 0..30 {
        match reqwest::blocking::get("http://localhost:18080/api/tasks") {
            Ok(resp) if resp.status().is_success() => {
                println!("后端就绪");
                return true;
            }
            _ => thread::sleep(Duration::from_secs(1)),
        }
    }
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
        .setup(|app| {
            let handle = app.handle().clone();
            thread::spawn(move || {
                if wait_for_backend() {
                    thread::sleep(Duration::from_millis(500));
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window.eval("window.location.href = 'http://localhost:18080'");
                    }
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
