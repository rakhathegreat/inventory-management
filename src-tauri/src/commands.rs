use tauri::Manager;

#[tauri::command]
pub fn save_arxiva_file(
    subfolder: String,
    filename: String,
    data: Vec<u8>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let download_dir = app_handle
        .path()
        .download_dir()
        .map_err(|e| format!("Gagal mendapatkan folder download: {}", e))?;

    let target_dir = download_dir.join("arxiva").join(subfolder);
    std::fs::create_dir_all(&target_dir)
        .map_err(|e| format!("Gagal membuat folder arxiva: {}", e))?;

    let file_path = target_dir.join(filename);
    std::fs::write(&file_path, data)
        .map_err(|e| format!("Gagal menyimpan file: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}
