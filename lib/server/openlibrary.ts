type OpenLibrarySearchResult = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
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
