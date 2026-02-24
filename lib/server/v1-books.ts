import type { InValue } from "@libsql/client";
import { getDb } from "@/lib/server/db";

export type V1HighlightInput =
  | string
  | {
      id?: string;
      position?: number;
      text: string;
      createdAtIso?: string;
      updatedAtIso?: string;
    };

export type V1BookPayload = {
  id: string;
  title: string;
  author?: string;
  notes?: string;
  coverUrl?: string;
  coverStorageKey?: string | null;
  status?: string;
  rating?: number;
  pageCount?: number;
  progressPercent?: number;
  medium?: string;
  startDateIso?: string | null;
  endDateIso?: string | null;
  createdAtIso?: string;
  updatedAtIso?: string;
  deletedAtIso?: string | null;
  version?: number;
  clientUpdatedAtIso?: string;
  baseVersion?: number;
  highlights?: V1HighlightInput[];
};

type V1BookRow = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  notes: string;
  cover_url: string;
  cover_storage_key: string | null;
  status: string;
  rating: number;
  page_count: number;
  progress_percent: number;
  medium: string;
  start_date_iso: string | null;
  end_date_iso: string | null;
  created_at_iso: string;
  updated_at_iso: string;
  deleted_at_iso: string | null;
  version: number;
};

type V1HighlightRow = {
  id: string;
  user_id: string;
  book_id: string;
  position: number;
  text: string;
  created_at_iso: string;
  updated_at_iso: string;
};

function toInt(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mapBookRow(row: Record<string, unknown>) {
  return row as unknown as V1BookRow;
}

function mapHighlightRow(row: Record<string, unknown>) {
  return row as unknown as V1HighlightRow;
}

function toBookResponse(row: V1BookRow, highlights: V1HighlightRow[]) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    notes: row.notes,
    coverUrl: row.cover_url,
    coverStorageKey: row.cover_storage_key,
    status: row.status,
    rating: row.rating,
    pageCount: row.page_count,
    progressPercent: row.progress_percent,
    medium: row.medium,
    startDateIso: row.start_date_iso,
    endDateIso: row.end_date_iso,
    createdAtIso: row.created_at_iso,
    updatedAtIso: row.updated_at_iso,
    deletedAtIso: row.deleted_at_iso,
    version: row.version,
    highlights: highlights
      .sort((a, b) => a.position - b.position || a.created_at_iso.localeCompare(b.created_at_iso))
      .map((h) => ({
        id: h.id,
        position: h.position,
        text: h.text,
        createdAtIso: h.created_at_iso,
        updatedAtIso: h.updated_at_iso,
      })),
  };
}

async function listHighlightsByBookIds(userId: string, bookIds: string[]) {
  if (bookIds.length === 0) {
    return new Map<string, V1HighlightRow[]>();
  }

  const db = await getDb();
  const placeholders = bookIds.map(() => "?").join(", ");
  const result = await db.execute(
    `SELECT * FROM user_book_highlights WHERE user_id = ? AND book_id IN (${placeholders}) ORDER BY position ASC`,
    [userId, ...bookIds] as InValue[],
  );

  const byBook = new Map<string, V1HighlightRow[]>();
  for (const raw of result.rows as unknown as Record<string, unknown>[]) {
    const row = mapHighlightRow(raw);
    const arr = byBook.get(row.book_id) ?? [];
    arr.push(row);
    byBook.set(row.book_id, arr);
  }
  return byBook;
}

export async function listUserBooks(userId: string, opts?: { includeDeleted?: boolean }) {
  const db = await getDb();
  const includeDeleted = opts?.includeDeleted ?? true;
  const result = await db.execute(
    `SELECT * FROM user_books WHERE user_id = ? ${includeDeleted ? "" : "AND deleted_at_iso IS NULL"} ORDER BY updated_at_iso DESC`,
    [userId],
  );
  const rows = (result.rows as unknown as Record<string, unknown>[]).map(mapBookRow);
  const highlightsByBook = await listHighlightsByBookIds(
    userId,
    rows.map((r) => r.id),
  );
  return rows.map((row) => toBookResponse(row, highlightsByBook.get(row.id) ?? []));
}

export async function getUserBook(userId: string, bookId: string) {
  const db = await getDb();
  const bookRes = await db.execute("SELECT * FROM user_books WHERE user_id = ? AND id = ? LIMIT 1", [userId, bookId]);
  const raw = bookRes.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!raw) {
    return null;
  }
  const row = mapBookRow(raw);
  const highlightsRes = await db.execute(
    "SELECT * FROM user_book_highlights WHERE user_id = ? AND book_id = ? ORDER BY position ASC",
    [userId, bookId],
  );
  const highlights = (highlightsRes.rows as unknown as Record<string, unknown>[]).map(mapHighlightRow);
  return toBookResponse(row, highlights);
}

function normalizeHighlights(items: V1HighlightInput[] | undefined, now: string) {
  return (items ?? []).map((item, index) => {
    if (typeof item === "string") {
      return {
        id: crypto.randomUUID(),
        position: index,
        text: item,
        createdAtIso: now,
        updatedAtIso: now,
      };
    }

    return {
      id: item.id ?? crypto.randomUUID(),
      position: toInt(item.position, index),
      text: String(item.text ?? "").trim(),
      createdAtIso: item.createdAtIso ?? now,
      updatedAtIso: item.updatedAtIso ?? now,
    };
  }).filter((h) => h.text.length > 0);
}

function normalizeBookPayload(input: V1BookPayload, now: string) {
  return {
    id: String(input.id),
    title: String(input.title ?? "").trim(),
    author: String(input.author ?? ""),
    notes: String(input.notes ?? ""),
    coverUrl: String(input.coverUrl ?? ""),
    coverStorageKey: input.coverStorageKey == null ? null : String(input.coverStorageKey),
    status: String(input.status ?? "reading_list"),
    rating: clamp(toInt(input.rating, 0), 0, 5),
    pageCount: Math.max(0, toInt(input.pageCount, 0)),
    progressPercent: clamp(toInt(input.progressPercent, 0), 0, 100),
    medium: String(input.medium ?? ""),
    startDateIso: input.startDateIso == null ? null : String(input.startDateIso),
    endDateIso: input.endDateIso == null ? null : String(input.endDateIso),
    createdAtIso: input.createdAtIso ?? now,
    updatedAtIso: input.clientUpdatedAtIso ?? input.updatedAtIso ?? now,
    deletedAtIso: input.deletedAtIso == null ? null : String(input.deletedAtIso),
  };
}

export async function upsertUserBook(userId: string, id: string, input: V1BookPayload) {
  if (!id || !input.title) {
    throw Object.assign(new Error("Missing book id or title"), { status: 400 });
  }

  const db = await getDb();
  const now = new Date().toISOString();
  const normalized = normalizeBookPayload({ ...input, id }, now);
  const existing = await db.execute("SELECT * FROM user_books WHERE user_id = ? AND id = ? LIMIT 1", [userId, id]);
  const existingRow = existing.rows[0] as unknown as Record<string, unknown> | undefined;

  if (existingRow) {
    const current = mapBookRow(existingRow);
    if (typeof input.baseVersion === "number" && input.baseVersion !== current.version) {
      const currentBook = await getUserBook(userId, id);
      return {
        conflict: true as const,
        status: 409,
        body: {
          error: "Version conflict",
          serverBook: currentBook,
          serverVersion: current.version,
        },
      };
    }

    const nextVersion = Math.max(current.version + 1, toInt(input.version, current.version + 1));
    await db.execute(
      `UPDATE user_books SET
        title = ?, author = ?, notes = ?, cover_url = ?, cover_storage_key = ?, status = ?, rating = ?,
        page_count = ?, progress_percent = ?, medium = ?, start_date_iso = ?, end_date_iso = ?,
        updated_at_iso = ?, deleted_at_iso = ?, version = ?
       WHERE user_id = ? AND id = ?`,
      [
        normalized.title,
        normalized.author,
        normalized.notes,
        normalized.coverUrl,
        normalized.coverStorageKey,
        normalized.status,
        normalized.rating,
        normalized.pageCount,
        normalized.progressPercent,
        normalized.medium,
        normalized.startDateIso,
        normalized.endDateIso,
        normalized.updatedAtIso,
        normalized.deletedAtIso,
        nextVersion,
        userId,
        id,
      ] as InValue[],
    );

    await replaceHighlights(userId, id, normalizeHighlights(input.highlights, now));
    return { conflict: false as const, book: await getUserBook(userId, id) };
  }

  await db.execute(
    `INSERT INTO user_books (
      id, user_id, title, author, notes, cover_url, cover_storage_key, status, rating, page_count,
      progress_percent, medium, start_date_iso, end_date_iso, created_at_iso, updated_at_iso, deleted_at_iso, version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      normalized.title,
      normalized.author,
      normalized.notes,
      normalized.coverUrl,
      normalized.coverStorageKey,
      normalized.status,
      normalized.rating,
      normalized.pageCount,
      normalized.progressPercent,
      normalized.medium,
      normalized.startDateIso,
      normalized.endDateIso,
      normalized.createdAtIso,
      normalized.updatedAtIso,
      normalized.deletedAtIso,
      Math.max(1, toInt(input.version, 1)),
    ] as InValue[],
  );

  await replaceHighlights(userId, id, normalizeHighlights(input.highlights, now));
  return { conflict: false as const, book: await getUserBook(userId, id) };
}

async function replaceHighlights(
  userId: string,
  bookId: string,
  highlights: Array<{ id: string; position: number; text: string; createdAtIso: string; updatedAtIso: string }>,
) {
  const db = await getDb();
  await db.execute("DELETE FROM user_book_highlights WHERE user_id = ? AND book_id = ?", [userId, bookId]);
  for (const h of highlights) {
    await db.execute(
      `INSERT INTO user_book_highlights (id, user_id, book_id, position, text, created_at_iso, updated_at_iso)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [h.id, userId, bookId, h.position, h.text, h.createdAtIso, h.updatedAtIso] as InValue[],
    );
  }
}

export async function softDeleteUserBook(userId: string, id: string) {
  const db = await getDb();
  const existing = await db.execute("SELECT version FROM user_books WHERE user_id = ? AND id = ? LIMIT 1", [userId, id]);
  if (existing.rows.length === 0) {
    throw Object.assign(new Error("Book not found"), { status: 404 });
  }
  const currentVersion = toInt((existing.rows[0] as Record<string, unknown>).version, 1);
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE user_books SET deleted_at_iso = ?, updated_at_iso = ?, version = ? WHERE user_id = ? AND id = ?",
    [now, now, currentVersion + 1, userId, id] as InValue[],
  );
  return { deletedAtIso: now, version: currentVersion + 1 };
}

export async function listUserChangesSince(userId: string, sinceIso: string) {
  const db = await getDb();
  const changed = await db.execute(
    "SELECT * FROM user_books WHERE user_id = ? AND updated_at_iso > ? ORDER BY updated_at_iso ASC",
    [userId, sinceIso],
  );
  const rows = (changed.rows as unknown as Record<string, unknown>[]).map(mapBookRow);
  const highlightsByBook = await listHighlightsByBookIds(userId, rows.map((r) => r.id));

  return {
    booksUpserted: rows.filter((r) => !r.deleted_at_iso).map((r) => toBookResponse(r, highlightsByBook.get(r.id) ?? [])),
    bookIdsDeleted: rows.filter((r) => !!r.deleted_at_iso).map((r) => r.id),
    serverNow: new Date().toISOString(),
  };
}

