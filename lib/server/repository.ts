import type { InValue } from "@libsql/client";
import { getDb } from "@/lib/server/db";
import { safeJsonParse, toJsonString } from "@/lib/server/json";
import { DEFAULT_BOOK_VALUES, type BookRow, type TagRow } from "@/lib/server/types";
import { getOpenLibraryBookPayload } from "@/lib/server/openlibrary";

const BOOK_UPDATABLE_FIELDS = new Set([
  "id",
  "title",
  "authors",
  "imageLinks",
  "pageCount",
  "publishedDate",
  "fullPublishDate",
  "publisher",
  "industryIdentifiers",
  "highlights",
  "startedOn",
  "finishedOn",
  "readingMedium",
  "shelf",
  "hasHighlights",
  "readingProgress",
  "bookDescription",
  "subjects",
  "tags",
]);

function normalizeBookRow(input: Partial<BookRow>): BookRow {
  return {
    ...DEFAULT_BOOK_VALUES,
    ...input,
    id: String(input.id ?? ""),
    title: String(input.title ?? ""),
    authors: typeof input.authors === "string" ? input.authors : "[]",
    imageLinks: typeof input.imageLinks === "string" ? input.imageLinks : "{}",
    industryIdentifiers: typeof input.industryIdentifiers === "string" ? input.industryIdentifiers : "[]",
    highlights: typeof input.highlights === "string" ? input.highlights : "[]",
    subjects: typeof input.subjects === "string" ? input.subjects : "[]",
    tags: typeof input.tags === "string" ? input.tags : "[]",
    hasHighlights: Number(input.hasHighlights ?? 0) ? 1 : 0,
    readingProgress: Math.max(0, Math.min(100, Number(input.readingProgress ?? 0) || 0)),
    pageCount: input.pageCount == null ? null : Number(input.pageCount),
  };
}

function rowFromSql(row: Record<string, unknown>): BookRow {
  return normalizeBookRow(row as Partial<BookRow>);
}

function tagFromSql(row: Record<string, unknown>): TagRow {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    color: String(row.color ?? "purple"),
    createdAt: String(row.createdAt ?? new Date().toISOString()),
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
  };
}

function sortPublicBooks(a: BookRow, b: BookRow) {
  const rank = (shelf: string) => {
    if (shelf === "currentlyReading") return 0;
    if (shelf === "abandoned") return 1;
    return 2;
  };
  const shelfDelta = rank(a.shelf) - rank(b.shelf);
  if (shelfDelta !== 0) return shelfDelta;
  const aFinished = a.finishedOn ?? "";
  const bFinished = b.finishedOn ?? "";
  if (aFinished !== bFinished) return aFinished < bFinished ? 1 : -1;
  return a.title.localeCompare(b.title);
}

function toLightweightPublicBook(row: BookRow) {
  return {
    id: row.id,
    title: row.title,
    authors: row.authors,
    imageLinks: row.imageLinks,
    shelf: row.shelf,
    readingMedium: row.readingMedium,
    finishedOn: row.finishedOn,
    tags: row.tags,
    readingProgress: row.readingProgress,
  };
}

export async function listAllBooks() {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM books");
  return result.rows.map((row) => rowFromSql(row as Record<string, unknown>));
}

export async function getBookById(id: string) {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM books WHERE id = ? LIMIT 1", [id]);
  const row = result.rows[0];
  return row ? rowFromSql(row as Record<string, unknown>) : null;
}

export async function listTags() {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM tags ORDER BY createdAt DESC");
  return result.rows.map((row) => tagFromSql(row as Record<string, unknown>));
}

export async function listPublicBooks(params: { limit: number; offset: number; q?: string }) {
  const books = await listAllBooks();
  let filtered = books;

  if (params.q) {
    const needle = params.q.trim().toLowerCase();
    filtered = books.filter((book) => {
      const authors = safeJsonParse<string[]>(book.authors, []).join(" ");
      const highlights = safeJsonParse<string[]>(book.highlights, []).join(" ");
      const description = book.bookDescription ?? "";
      return [book.title, authors, highlights, description].join(" ").toLowerCase().includes(needle);
    });
  }

  return filtered.sort(sortPublicBooks).slice(params.offset, params.offset + params.limit).map(toLightweightPublicBook);
}

export async function getPublicStats() {
  const books = await listAllBooks();
  const booksByYear: Record<string, Array<Record<string, unknown>>> = {};
  const authorCounts = new Map<string, { count: number; books: Array<{ title: string; year: string }> }>();
  const mediumStats: Record<string, number> = {};
  let pages = 0;

  for (const book of books) {
    if (book.pageCount) pages += book.pageCount;
    if (book.readingMedium) {
      mediumStats[book.readingMedium] = (mediumStats[book.readingMedium] ?? 0) + 1;
    }

    const finishedYear = book.finishedOn?.slice(0, 4);
    if (finishedYear) {
      booksByYear[finishedYear] ??= [];
      booksByYear[finishedYear].push({
        id: book.id,
        title: book.title,
        authors: safeJsonParse<string[]>(book.authors, []),
        imageLinks: safeJsonParse<Record<string, string>>(book.imageLinks, {}),
        pageCount: book.pageCount,
        finishedOn: book.finishedOn,
        readingMedium: book.readingMedium,
      });
    }

    for (const author of safeJsonParse<string[]>(book.authors, [])) {
      const entry = authorCounts.get(author) ?? { count: 0, books: [] };
      entry.count += 1;
      entry.books.push({ title: book.title, year: finishedYear ?? "unknown" });
      authorCounts.set(author, entry);
    }
  }

  const authorStats = Array.from(authorCounts.entries())
    .map(([name, info]) => ({ name, count: info.count, books: info.books }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const years = Object.keys(booksByYear);
  const avgPerYear = years.length > 0 ? (books.length / years.length).toFixed(1) : "0.0";

  return {
    booksByYear,
    authorStats,
    mediumStats,
    totals: {
      books: books.length,
      pages,
      avgPerYear,
    },
  };
}

export async function getRandomHighlight() {
  const books = await listAllBooks();
  const pool = books.flatMap((book) =>
    safeJsonParse<string[]>(book.highlights, []).map((highlight) => ({
      id: book.id,
      title: book.title,
      authors: safeJsonParse<string[]>(book.authors, []),
      highlight,
    })),
  );

  if (pool.length === 0) {
    return null;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export async function exportHugoPayload() {
  const [books, tags, stats] = await Promise.all([listAllBooks(), listTags(), getPublicStats()]);
  const parsedBooks = books.map((book) => ({
    ...book,
    authors: safeJsonParse<string[]>(book.authors, []),
    imageLinks: safeJsonParse<Record<string, string>>(book.imageLinks, {}),
    industryIdentifiers: safeJsonParse<string[]>(book.industryIdentifiers, []),
    highlights: safeJsonParse<string[]>(book.highlights, []),
    subjects: safeJsonParse<string[]>(book.subjects, []),
    tags: safeJsonParse<string[]>(book.tags, []),
  }));

  const highlights = parsedBooks.flatMap((book) =>
    (book.highlights as string[]).map((highlight) => ({
      bookId: book.id,
      title: book.title,
      author: Array.isArray(book.authors) ? (book.authors[0] ?? "") : "",
      highlight,
      finishedOn: book.finishedOn,
    })),
  );

  return {
    generatedAt: new Date().toISOString(),
    books: parsedBooks,
    tags,
    highlights,
    stats: {
      totals: { books: parsedBooks.length },
      booksByYear: stats.booksByYear,
    },
  };
}

export async function addBookFromOpenLibrary(params: { olid: string; shelf?: string }) {
  const db = await getDb();
  const existing = await getBookById(params.olid);
  if (existing) {
    return existing;
  }

  const meta = await getOpenLibraryBookPayload(params.olid);
  const now = new Date().toISOString();
  const book = normalizeBookRow({
    id: meta.id,
    title: meta.title,
    authors: toJsonString(meta.authors, "[]"),
    imageLinks: toJsonString(meta.imageLinks, "{}"),
    pageCount: meta.pageCount,
    publishedDate: meta.publishedDate ?? null,
    fullPublishDate: meta.fullPublishDate ?? null,
    publisher: meta.publisher ?? null,
    industryIdentifiers: toJsonString(meta.industryIdentifiers, "[]"),
    highlights: "[]",
    startedOn: null,
    finishedOn: null,
    readingMedium: "Not set",
    shelf: params.shelf ?? "watchlist",
    hasHighlights: 0,
    readingProgress: 0,
    bookDescription: meta.bookDescription ?? null,
    subjects: toJsonString(meta.subjects, "[]"),
    tags: "[]",
    createdAt: now,
    updatedAt: now,
  });

  await db.execute(
    `INSERT INTO books (
      id, title, authors, imageLinks, pageCount, publishedDate, fullPublishDate, publisher,
      industryIdentifiers, highlights, startedOn, finishedOn, readingMedium, shelf, hasHighlights,
      readingProgress, bookDescription, subjects, tags, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      book.id,
      book.title,
      book.authors,
      book.imageLinks,
      book.pageCount,
      book.publishedDate,
      book.fullPublishDate,
      book.publisher,
      book.industryIdentifiers,
      book.highlights,
      book.startedOn,
      book.finishedOn,
      book.readingMedium,
      book.shelf,
      book.hasHighlights,
      book.readingProgress,
      book.bookDescription,
      book.subjects,
      book.tags,
      now,
      now,
    ],
  );

  return book;
}

function normalizeBookPatch(data: Record<string, unknown>) {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!BOOK_UPDATABLE_FIELDS.has(key)) continue;
    if (["authors", "imageLinks", "industryIdentifiers", "highlights", "subjects", "tags"].includes(key)) {
      patch[key] = typeof value === "string" ? value : JSON.stringify(value ?? []);
      continue;
    }
    if (key === "hasHighlights") {
      patch[key] = value ? 1 : 0;
      continue;
    }
    if (key === "readingProgress") {
      patch[key] = Math.max(0, Math.min(100, Number(value ?? 0) || 0));
      continue;
    }
    patch[key] = value ?? null;
  }

  if ("highlights" in patch && !("hasHighlights" in patch)) {
    const parsed = safeJsonParse<string[]>(String(patch.highlights), []);
    patch.hasHighlights = parsed.length > 0 ? 1 : 0;
  }

  return patch;
}

export async function updateBook(data: Record<string, unknown>) {
  const db = await getDb();
  const id = String(data.id ?? "");
  if (!id) {
    throw Object.assign(new Error("Missing book id"), { status: 400 });
  }

  const originalId = data.originalId ? String(data.originalId) : id;
  const existing = await getBookById(originalId);
  if (!existing) {
    throw Object.assign(new Error("Book not found"), { status: 404 });
  }

  const patch = normalizeBookPatch(data);
  patch.updatedAt = new Date().toISOString();

  const entries = Object.entries(patch);
  if (entries.length === 0) {
    return { rowsAffected: 0 };
  }

  const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
  const sqlArgs = [...entries.map(([, value]) => value), originalId] as InValue[];
  await db.execute(`UPDATE books SET ${setClause} WHERE id = ?`, sqlArgs);

  return { rowsAffected: 1 };
}

export async function deleteBook(id: string) {
  const db = await getDb();
  await db.execute("DELETE FROM books WHERE id = ?", [id]);
}

export function parseHighlightsFile(fileContent: string, fileName: string) {
  const lower = fileName.toLowerCase();
  if (!lower.endsWith(".md") && !lower.endsWith(".html")) {
    throw Object.assign(new Error("fileName must end in .md or .html"), { status: 400 });
  }

  const titleMatch = fileContent.match(/title:\s*["']?(.+?)["']?\s*$/m);
  const title = titleMatch?.[1]?.trim() ?? "";

  let highlights: string[] = [];
  if (lower.endsWith(".md")) {
    highlights = fileContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- ") || line.startsWith("* "))
      .map((line) => line.slice(2).trim())
      .filter(Boolean);
  } else {
    const stripped = fileContent
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|li|div|blockquote|br)>/gi, "\n")
      .replace(/<[^>]+>/g, " ");
    highlights = stripped
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length > 20)
      .slice(0, 200);
  }

  return { title, highlights };
}

export async function createTag(data: { name?: unknown; color?: unknown }) {
  const name = String(data.name ?? "").trim();
  if (!name) {
    throw Object.assign(new Error("Missing tag name"), { status: 400 });
  }
  const color = String(data.color ?? "purple");
  const id = `tag_${Date.now()}`;
  const now = new Date().toISOString();
  const db = await getDb();
  await db.execute("INSERT INTO tags (id, name, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)", [
    id,
    name,
    color,
    now,
    now,
  ]);
  return { id };
}

export async function updateTag(data: { id?: unknown; name?: unknown; color?: unknown }) {
  const id = String(data.id ?? "");
  if (!id) {
    throw Object.assign(new Error("Missing tag id"), { status: 400 });
  }
  const sets: string[] = [];
  const args: unknown[] = [];
  if (data.name != null) {
    sets.push("name = ?");
    args.push(String(data.name));
  }
  if (data.color != null) {
    sets.push("color = ?");
    args.push(String(data.color));
  }
  sets.push("updatedAt = ?");
  args.push(new Date().toISOString());
  const db = await getDb();
  await db.execute(`UPDATE tags SET ${sets.join(", ")} WHERE id = ?`, [...args, id]);
}

export async function deleteTag(id: string) {
  const db = await getDb();
  await db.execute("DELETE FROM tags WHERE id = ?", [id]);

  const books = await listAllBooks();
  await Promise.all(
    books.map(async (book) => {
      const tags = safeJsonParse<string[]>(book.tags, []).filter((tag) => tag !== id);
      if (tags.length !== safeJsonParse<string[]>(book.tags, []).length) {
        await db.execute("UPDATE books SET tags = ?, updatedAt = ? WHERE id = ?", [
          JSON.stringify(tags),
          new Date().toISOString(),
          book.id,
        ]);
      }
    }),
  );
}

export async function bulkAddTagToBooks(data: { tagId?: unknown; bookIds?: unknown }) {
  const tagId = String(data.tagId ?? "");
  const bookIds = Array.isArray(data.bookIds) ? data.bookIds.map(String) : [];
  if (!tagId || bookIds.length === 0) {
    throw Object.assign(new Error("Missing tagId or bookIds"), { status: 400 });
  }

  const db = await getDb();
  const now = new Date().toISOString();

  for (const bookId of bookIds) {
    const book = await getBookById(bookId);
    if (!book) continue;
    const tags = safeJsonParse<string[]>(book.tags, []);
    if (!tags.includes(tagId)) {
      tags.push(tagId);
      await db.execute("UPDATE books SET tags = ?, updatedAt = ? WHERE id = ?", [
        JSON.stringify(tags),
        now,
        bookId,
      ]);
    }
  }
}
