use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(db_path: PathBuf) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            total_items INTEGER DEFAULT 0
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS brands (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            identifier TEXT NOT NULL DEFAULT '',
            origin TEXT NOT NULL,
            total_items INTEGER DEFAULT 0
        )",
        [],
    )?;

    let has_brand_identifier = {
        let mut stmt = conn.prepare("PRAGMA table_info(brands)")?;
        let columns = stmt.query_map([], |row| row.get::<_, String>(1))?;
        let mut has_column = false;

        for column in columns {
            if column? == "identifier" {
                has_column = true;
                break;
            }
        }

        has_column
    };

    if !has_brand_identifier {
        conn.execute(
            "ALTER TABLE brands ADD COLUMN identifier TEXT NOT NULL DEFAULT ''",
            [],
        )?;
    }

    conn.execute(
        "UPDATE brands
         SET identifier = UPPER(SUBSTR(TRIM(name), 1, 3))
         WHERE identifier IS NULL OR TRIM(identifier) = ''",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS storage_locations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            capacity INTEGER,
            used_capacity INTEGER,
            brand_rule TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS storage_levels (
            id TEXT PRIMARY KEY,
            location_id TEXT NOT NULL,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            used_capacity INTEGER NOT NULL DEFAULT 0,
            brand_rule TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (location_id) REFERENCES storage_locations (id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            serial_number TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            brand TEXT NOT NULL,
            status TEXT NOT NULL,
            storage_location TEXT NOT NULL,
            entry_date TEXT NOT NULL,
            exit_date TEXT,
            operator TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            transaction_date TEXT NOT NULL,
            transaction_number TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT NOT NULL,
            serial_number TEXT NOT NULL,
            brand TEXT NOT NULL,
            origin TEXT,
            destination TEXT,
            operator TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            is_read INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )?;

    Ok(conn)
}
