type OpenLibrarySearchResult = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  edition_count?: number;
  publisher?: string[];
  isbn?: string[];
  language?: string[];
  subject?: string[];
  number_of_pages_median?: number;
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibrarySearchResult[];
};

export async function searchOpenLibrary(query: string) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");

  const res = await fetch(url, {
    headers: { "User-Agent": "book-tracker-backend/1.0" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`OpenLibrary search failed (${res.status})`);
  }

  const payload = (await res.json()) as OpenLibrarySearchResponse;
  return (payload.docs ?? []).slice(0, 20).map((doc) => ({
    key: String(doc.key ?? "").replace(/^\/works\//, ""),
    title: doc.title ?? "Untitled",
    author_name: doc.author_name ?? [],
    first_publish_year: doc.first_publish_year ?? null,
    cover_i: doc.cover_i ?? null,
  }));
}

export async function searchOpenLibraryForApp(query: string, limit = 20) {
  const safeLimit = Math.max(1, Math.min(40, limit));
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(safeLimit));

  const res = await fetch(url, {
    headers: { "User-Agent": "book-tracker-backend/1.0" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`OpenLibrary search failed (${res.status})`);
  }

  const payload = (await res.json()) as OpenLibrarySearchResponse;
  return (payload.docs ?? []).slice(0, safeLimit).map((doc) => {
    const workId = String(doc.key ?? "").replace(/^\/works\//, "");
    const coverId = doc.cover_i ?? null;
    return {
      id: workId,
      workId,
      openLibraryKey: String(doc.key ?? ""),
      title: doc.title ?? "Untitled",
      authors: doc.author_name ?? [],
      author: doc.author_name?.[0] ?? "",
      firstPublishYear: doc.first_publish_year ?? null,
      pageCount: doc.number_of_pages_median ?? null,
      editionCount: doc.edition_count ?? null,
      publishers: (doc.publisher ?? []).slice(0, 5),
      isbn: (doc.isbn ?? []).slice(0, 5),
      languages: (doc.language ?? []).slice(0, 10),
      subjects: (doc.subject ?? []).slice(0, 15),
      coverId,
      coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
      thumbnailUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
      source: "openlibrary" as const,
    };
  });
}

type OpenLibraryWork = {
  title?: string;
  description?: string | { value?: string };
  subjects?: string[];
  covers?: number[];
  first_publish_date?: string;
};

type OpenLibraryEditionSearch = {
  docs?: Array<{
    number_of_pages_median?: number;
    publisher?: string[];
    isbn?: string[];
    publish_date?: string[];
    author_name?: string[];
  }>;
};

export async function getOpenLibraryBookPayload(olid: string) {
  const workUrl = `https://openlibrary.org/works/${olid}.json`;
  const editionUrl = `https://openlibrary.org/search.json?key=/works/${olid}&limit=1`;

  const [workRes, editionRes] = await Promise.all([
    fetch(workUrl, { headers: { "User-Agent": "book-tracker-backend/1.0" }, cache: "no-store" }),
    fetch(editionUrl, { headers: { "User-Agent": "book-tracker-backend/1.0" }, cache: "no-store" }),
  ]);

  if (!workRes.ok) {
    throw new Error(`OpenLibrary work lookup failed (${workRes.status})`);
  }

  const work = (await workRes.json()) as OpenLibraryWork;
  const edition = editionRes.ok ? ((await editionRes.json()) as OpenLibraryEditionSearch) : { docs: [] };
  const firstEdition = edition.docs?.[0];

  const description =
    typeof work.description === "string"
      ? work.description
      : typeof work.description?.value === "string"
        ? work.description.value
        : null;

  const coverId = work.covers?.[0] ?? null;
  const authors = firstEdition?.author_name ?? [];
  const firstPublishDate = work.first_publish_date ?? firstEdition?.publish_date?.[0] ?? null;
  const thumbnail = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "";

  return {
    id: olid,
    title: work.title ?? "Untitled",
    authors,
    imageLinks: thumbnail ? { thumbnail } : {},
    pageCount: firstEdition?.number_of_pages_median ?? null,
    publishedDate: firstPublishDate,
    fullPublishDate: firstPublishDate,
    publisher: firstEdition?.publisher?.[0] ?? null,
    industryIdentifiers: (firstEdition?.isbn ?? []).slice(0, 5),
    bookDescription: description,
    subjects: (work.subjects ?? []).slice(0, 30),
  };
}
