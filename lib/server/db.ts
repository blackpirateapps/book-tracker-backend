import { createClient, type Client } from "@libsql/client";
import { getTursoConfig } from "@/lib/server/env";

let client: Client | null = null;
let schemaReadyPromise: Promise<void> | null = null;

function getClient() {
  if (client) {
    return client;
  }
  const config = getTursoConfig();
  client = createClient(config);
  return client;
}

async function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const db = getClient();
      await db.execute(`CREATE TABLE IF NOT EXISTS books (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            authors TEXT NOT NULL DEFAULT '[]',
            imageLinks TEXT NOT NULL DEFAULT '{}',
            pageCount INTEGER,
            publishedDate TEXT,
            fullPublishDate TEXT,
            publisher TEXT,
            industryIdentifiers TEXT NOT NULL DEFAULT '[]',
            highlights TEXT NOT NULL DEFAULT '[]',
            startedOn TEXT,
            finishedOn TEXT,
            readingMedium TEXT NOT NULL DEFAULT 'Not set',
            shelf TEXT NOT NULL DEFAULT 'watchlist',
            hasHighlights INTEGER NOT NULL DEFAULT 0,
            readingProgress INTEGER NOT NULL DEFAULT 0,
            bookDescription TEXT,
            subjects TEXT NOT NULL DEFAULT '[]',
            tags TEXT NOT NULL DEFAULT '[]',
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )`);
      await db.execute(`CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT 'purple',
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )`);
      await db.execute(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT,
            display_name TEXT,
            photo_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )`);
      await db.execute(`CREATE TABLE IF NOT EXISTS user_books (
            id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            author TEXT NOT NULL DEFAULT '',
            notes TEXT NOT NULL DEFAULT '',
            cover_url TEXT NOT NULL DEFAULT '',
            cover_storage_key TEXT,
            status TEXT NOT NULL,
            rating INTEGER NOT NULL DEFAULT 0,
            page_count INTEGER NOT NULL DEFAULT 0,
            progress_percent INTEGER NOT NULL DEFAULT 0,
            medium TEXT NOT NULL DEFAULT '',
            start_date_iso TEXT,
            end_date_iso TEXT,
            created_at_iso TEXT NOT NULL,
            updated_at_iso TEXT NOT NULL,
            deleted_at_iso TEXT,
            version INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (user_id, id)
          )`);
      await db.execute(`CREATE TABLE IF NOT EXISTS user_book_highlights (
            id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            text TEXT NOT NULL,
            created_at_iso TEXT NOT NULL,
            updated_at_iso TEXT NOT NULL,
            PRIMARY KEY (user_id, id)
          )`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_books_shelf ON books(shelf)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_books_finishedOn ON books(finishedOn)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_books_updatedAt ON books(updatedAt)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_books_updated ON user_books(user_id, updated_at_iso)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_books_deleted ON user_books(user_id, deleted_at_iso)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_books_status ON user_books(user_id, status)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_book_highlights_book ON user_book_highlights(user_id, book_id)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_user_book_highlights_updated ON user_book_highlights(user_id, updated_at_iso)`);
    })();
  }

  return schemaReadyPromise;
}

export async function getDb() {
  await ensureSchema();
  return getClient();
}
