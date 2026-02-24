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
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_books_shelf ON books(shelf)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_books_finishedOn ON books(finishedOn)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_books_updatedAt ON books(updatedAt)`);
    })();
  }

  return schemaReadyPromise;
}

export async function getDb() {
  await ensureSchema();
  return getClient();
}
