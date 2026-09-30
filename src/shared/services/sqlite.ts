import * as SQLite from "expo-sqlite";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("mediate_mr_local.db");
    await initDatabase(dbInstance);
  }
  return dbInstance;
}

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid TEXT UNIQUE NOT NULL,
      action_type TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);
  `);
}
