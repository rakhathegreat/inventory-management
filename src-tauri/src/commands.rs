use crate::db::DbState;
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

#[tauri::command]
pub fn save_export_file(path: String, contents: String) -> Result<(), String> {
    let export_path = PathBuf::from(path);

    if let Some(parent) = export_path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    std::fs::write(export_path, contents.as_bytes()).map_err(|error| error.to_string())
}

#[derive(Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(rename = "totalItems")]
    pub total_items: i32,
}

#[derive(Serialize, Deserialize)]
pub struct Brand {
    pub id: String,
    pub name: String,
    pub identifier: String,
    pub origin: String,
    #[serde(rename = "totalItems")]
    pub total_items: i32,
}

// Category Commands
#[tauri::command]
pub fn get_categories(state: State<DbState>) -> Result<Vec<Category>, String> {
    let conn = state.0.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, name, description, total_items FROM categories")
        .map_err(|e| e.to_string())?;

    let categories_iter = stmt
        .query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                total_items: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut categories = Vec::new();
    for category in categories_iter {
        categories.push(category.map_err(|e| e.to_string())?);
    }

    Ok(categories)
}

#[tauri::command]
pub fn add_category(state: State<DbState>, category: Category) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "INSERT INTO categories (id, name, description, total_items) VALUES (?1, ?2, ?3, ?4)",
        params![
            category.id,
            category.name,
            category.description,
            category.total_items
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_category(state: State<DbState>, category: Category) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "UPDATE categories SET name = ?1, description = ?2, total_items = ?3 WHERE id = ?4",
        params![
            category.name,
            category.description,
            category.total_items,
            category.id
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_category(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute("DELETE FROM categories WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Brand Commands
#[tauri::command]
pub fn get_brands(state: State<DbState>) -> Result<Vec<Brand>, String> {
    let conn = state.0.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, name, identifier, origin, total_items FROM brands")
        .map_err(|e| e.to_string())?;

    let brands_iter = stmt
        .query_map([], |row| {
            Ok(Brand {
                id: row.get(0)?,
                name: row.get(1)?,
                identifier: row.get(2)?,
                origin: row.get(3)?,
                total_items: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut brands = Vec::new();
    for brand in brands_iter {
        brands.push(brand.map_err(|e| e.to_string())?);
    }

    Ok(brands)
}

#[tauri::command]
pub fn add_brand(state: State<DbState>, brand: Brand) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "INSERT INTO brands (id, name, identifier, origin, total_items) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![brand.id, brand.name, brand.identifier, brand.origin, brand.total_items],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_brand(state: State<DbState>, brand: Brand) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "UPDATE brands SET name = ?1, identifier = ?2, origin = ?3, total_items = ?4 WHERE id = ?5",
        params![
            brand.name,
            brand.identifier,
            brand.origin,
            brand.total_items,
            brand.id
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_brand(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute("DELETE FROM brands WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Storage Location Structs & Commands
#[derive(Serialize, Deserialize, Clone)]
pub struct Level {
    pub id: String,
    pub name: String,
    pub capacity: i32,
    #[serde(rename = "usedCapacity")]
    pub used_capacity: i32,
    #[serde(rename = "brandRule")]
    pub brand_rule: String,
    #[serde(rename = "isActive")]
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct StorageLocation {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub location_type: String, // "Rak" or "Kardus"
    #[serde(rename = "isActive")]
    pub is_active: bool,
    pub levels: Option<Vec<Level>>,
    pub capacity: Option<i32>,
    #[serde(rename = "usedCapacity")]
    pub used_capacity: Option<i32>,
    #[serde(rename = "brandRule")]
    pub brand_rule: Option<String>,
}

#[tauri::command]
pub fn get_locations(state: State<DbState>) -> Result<Vec<StorageLocation>, String> {
    let conn = state.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, type, is_active, capacity, used_capacity, brand_rule FROM storage_locations").map_err(|e| e.to_string())?;

    let locations_iter = stmt
        .query_map([], |row| {
            let id: String = row.get(0)?;
            let name: String = row.get(1)?;
            let location_type: String = row.get(2)?;
            let is_active_val: i32 = row.get(3)?;
            let is_active = is_active_val != 0;
            let capacity: Option<i32> = row.get(4)?;
            let used_capacity: Option<i32> = row.get(5)?;
            let brand_rule: Option<String> = row.get(6)?;

            Ok(StorageLocation {
                id,
                name,
                location_type,
                is_active,
                levels: None,
                capacity,
                used_capacity,
                brand_rule,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut locations = Vec::new();
    for loc_res in locations_iter {
        let mut loc = loc_res.map_err(|e| e.to_string())?;
        if loc.location_type == "Rak" {
            let mut lvl_stmt = conn.prepare("SELECT id, name, capacity, used_capacity, brand_rule, is_active FROM storage_levels WHERE location_id = ?1").map_err(|e| e.to_string())?;
            let lvls_iter = lvl_stmt
                .query_map(params![loc.id], |r| {
                    let is_active_val: i32 = r.get(5)?;
                    Ok(Level {
                        id: r.get(0)?,
                        name: r.get(1)?,
                        capacity: r.get(2)?,
                        used_capacity: r.get(3)?,
                        brand_rule: r.get(4)?,
                        is_active: is_active_val != 0,
                    })
                })
                .map_err(|e| e.to_string())?;

            let mut lvls = Vec::new();
            for lvl in lvls_iter {
                lvls.push(lvl.map_err(|e| e.to_string())?);
            }
            loc.levels = Some(lvls);
        }
        locations.push(loc);
    }

    Ok(locations)
}

#[tauri::command]
pub fn save_location(state: State<DbState>, location: StorageLocation) -> Result<(), String> {
    let mut conn = state.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Check if location already exists
    let exists: bool = tx
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM storage_locations WHERE id = ?1)",
            params![location.id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if exists {
        tx.execute(
            "UPDATE storage_locations SET name = ?1, type = ?2, is_active = ?3, capacity = ?4, used_capacity = ?5, brand_rule = ?6 WHERE id = ?7",
            params![
                location.name,
                location.location_type,
                if location.is_active { 1 } else { 0 },
                location.capacity,
                location.used_capacity,
                location.brand_rule,
                location.id
            ],
        ).map_err(|e| e.to_string())?;
    } else {
        tx.execute(
            "INSERT INTO storage_locations (id, name, type, is_active, capacity, used_capacity, brand_rule) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                location.id,
                location.name,
                location.location_type,
                if location.is_active { 1 } else { 0 },
                location.capacity,
                location.used_capacity,
                location.brand_rule
            ],
        ).map_err(|e| e.to_string())?;
    }

    // Upsert levels if present
    if let Some(levels) = location.levels {
        for level in levels {
            let lvl_exists: bool = tx
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM storage_levels WHERE id = ?1)",
                    params![level.id],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;

            if lvl_exists {
                tx.execute(
                    "UPDATE storage_levels SET name = ?1, capacity = ?2, used_capacity = ?3, brand_rule = ?4, is_active = ?5 WHERE id = ?6",
                    params![
                        level.name,
                        level.capacity,
                        level.used_capacity,
                        level.brand_rule,
                        if level.is_active { 1 } else { 0 },
                        level.id
                    ],
                ).map_err(|e| e.to_string())?;
            } else {
                tx.execute(
                    "INSERT INTO storage_levels (id, location_id, name, capacity, used_capacity, brand_rule, is_active) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                    params![
                        level.id,
                        location.id,
                        level.name,
                        level.capacity,
                        level.used_capacity,
                        level.brand_rule,
                        if level.is_active { 1 } else { 0 }
                    ],
                ).map_err(|e| e.to_string())?;
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_location(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute("DELETE FROM storage_locations WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_level(state: State<DbState>, level: Level, location_id: String) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM storage_levels WHERE id = ?1)",
            params![level.id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if exists {
        conn.execute(
            "UPDATE storage_levels SET name = ?1, capacity = ?2, used_capacity = ?3, brand_rule = ?4, is_active = ?5 WHERE id = ?6",
            params![
                level.name,
                level.capacity,
                level.used_capacity,
                level.brand_rule,
                if level.is_active { 1 } else { 0 },
                level.id
            ],
        ).map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO storage_levels (id, location_id, name, capacity, used_capacity, brand_rule, is_active) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                level.id,
                location_id,
                level.name,
                level.capacity,
                level.used_capacity,
                level.brand_rule,
                if level.is_active { 1 } else { 0 }
            ],
        ).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn delete_level(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute("DELETE FROM storage_levels WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn toggle_location_active(
    state: State<DbState>,
    id: String,
    is_active: bool,
) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "UPDATE storage_locations SET is_active = ?1 WHERE id = ?2",
        params![if is_active { 1 } else { 0 }, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn toggle_level_active(
    state: State<DbState>,
    id: String,
    is_active: bool,
) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "UPDATE storage_levels SET is_active = ?1 WHERE id = ?2",
        params![if is_active { 1 } else { 0 }, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

// Item Commands
#[derive(Serialize, Deserialize)]
pub struct Item {
    pub id: String,
    #[serde(rename = "serialNumber")]
    pub serial_number: String,
    #[serde(rename = "kategori")]
    pub category: String,
    #[serde(rename = "merek")]
    pub brand: String,
    pub status: String,
    #[serde(rename = "lokasiPenyimpanan")]
    pub storage_location: String,
    #[serde(rename = "tanggalMasuk")]
    pub entry_date: String,
    #[serde(rename = "tanggalKeluar")]
    pub exit_date: Option<String>,
}

#[tauri::command]
pub fn get_items(state: State<DbState>) -> Result<Vec<Item>, String> {
    let conn = state.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, serial_number, category, brand, status, storage_location, entry_date, exit_date FROM items").map_err(|e| e.to_string())?;

    let items_iter = stmt
        .query_map([], |row| {
            Ok(Item {
                id: row.get(0)?,
                serial_number: row.get(1)?,
                category: row.get(2)?,
                brand: row.get(3)?,
                status: row.get(4)?,
                storage_location: row.get(5)?,
                entry_date: row.get(6)?,
                exit_date: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for item in items_iter {
        items.push(item.map_err(|e| e.to_string())?);
    }

    Ok(items)
}

#[tauri::command]
pub fn add_item(state: State<DbState>, item: Item) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "INSERT INTO items (id, serial_number, category, brand, status, storage_location, entry_date, exit_date) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![item.id, item.serial_number, item.category, item.brand, item.status, item.storage_location, item.entry_date, item.exit_date],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_item(state: State<DbState>, item: Item) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "UPDATE items SET serial_number = ?1, category = ?2, brand = ?3, status = ?4, storage_location = ?5, entry_date = ?6, exit_date = ?7 WHERE id = ?8",
        params![item.serial_number, item.category, item.brand, item.status, item.storage_location, item.entry_date, item.exit_date, item.id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_item(state: State<DbState>, id: String) -> Result<(), String> {
    let mut conn = state.0.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let serial_number = tx
        .query_row(
            "SELECT serial_number FROM items WHERE id = ?1",
            params![id],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if let Some(serial_number) = serial_number {
        tx.execute(
            "DELETE FROM transactions WHERE serial_number = ?1",
            params![serial_number],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.execute("DELETE FROM items WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

// Transaction Commands
#[derive(Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub tanggal: String,
    pub nomor: String,
    pub kategori: String,
    pub status: String,
    pub sn: String,
    pub merek: String,
    pub asal: Option<String>,
    pub tujuan: Option<String>,
}

#[tauri::command]
pub fn get_transactions(state: State<DbState>) -> Result<Vec<Transaction>, String> {
    let conn = state.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, transaction_date, transaction_number, category, status, serial_number, brand, origin, destination FROM transactions ORDER BY transaction_date DESC").map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                tanggal: row.get(1)?,
                nomor: row.get(2)?,
                kategori: row.get(3)?,
                status: row.get(4)?,
                sn: row.get(5)?,
                merek: row.get(6)?,
                asal: row.get(7)?,
                tujuan: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut transactions = Vec::new();
    for t in iter {
        transactions.push(t.map_err(|e| e.to_string())?);
    }
    Ok(transactions)
}

#[tauri::command]
pub fn add_transaction(state: State<DbState>, transaction: Transaction) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "INSERT INTO transactions (id, transaction_date, transaction_number, category, status, serial_number, brand, origin, destination) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![transaction.id, transaction.tanggal, transaction.nomor, transaction.kategori, transaction.status, transaction.sn, transaction.merek, transaction.asal, transaction.tujuan],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_transaction(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute("DELETE FROM transactions WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Notification Commands
#[derive(Serialize, Deserialize)]
pub struct Notification {
    pub id: String,
    pub title: String,
    pub message: String,
    #[serde(rename = "type")]
    pub notif_type: String,
    pub date: String,
    #[serde(rename = "isRead")]
    pub is_read: bool,
}

#[tauri::command]
pub fn get_notifications(state: State<DbState>) -> Result<Vec<Notification>, String> {
    let conn = state.0.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id, title, message, type, date, is_read FROM notifications ORDER BY date DESC",
        )
        .map_err(|e| e.to_string())?;

    let iter = stmt
        .query_map([], |row| {
            let is_read_val: i32 = row.get(5)?;
            Ok(Notification {
                id: row.get(0)?,
                title: row.get(1)?,
                message: row.get(2)?,
                notif_type: row.get(3)?,
                date: row.get(4)?,
                is_read: is_read_val != 0,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut notifications = Vec::new();
    for n in iter {
        notifications.push(n.map_err(|e| e.to_string())?);
    }
    Ok(notifications)
}

#[tauri::command]
pub fn add_notification(state: State<DbState>, notification: Notification) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "INSERT INTO notifications (id, title, message, type, date, is_read) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![notification.id, notification.title, notification.message, notification.notif_type, notification.date, if notification.is_read { 1 } else { 0 }],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn mark_notification_read(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute(
        "UPDATE notifications SET is_read = 1 WHERE id = ?1",
        params![id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn mark_all_notifications_read(state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute("UPDATE notifications SET is_read = 1", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_notification(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().unwrap();
    conn.execute("DELETE FROM notifications WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
