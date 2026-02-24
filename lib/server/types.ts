export type JsonMap = Record<string, unknown>;

export type TagRow = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
};

export type BookRow = {
  id: string;
  title: string;
  authors: string;
  imageLinks: string;
  pageCount: number | null;
  publishedDate: string | null;
  fullPublishDate: string | null;
  publisher: string | null;
  industryIdentifiers: string;
  highlights: string;
  startedOn: string | null;
  finishedOn: string | null;
  readingMedium: string;
  shelf: string;
  hasHighlights: number;
  readingProgress: number;
  bookDescription: string | null;
  subjects: string;
  tags: string;
  createdAt?: string;
  updatedAt?: string;
};

export const BOOK_FIELDS = [
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
  "createdAt",
  "updatedAt",
] as const;

export const DEFAULT_BOOK_VALUES: BookRow = {
  id: "",
  title: "",
  authors: "[]",
  imageLinks: "{}",
  pageCount: null,
  publishedDate: null,
  fullPublishDate: null,
  publisher: null,
  industryIdentifiers: "[]",
  highlights: "[]",
  startedOn: null,
  finishedOn: null,
  readingMedium: "Not set",
  shelf: "watchlist",
  hasHighlights: 0,
  readingProgress: 0,
  bookDescription: null,
  subjects: "[]",
  tags: "[]",
};
