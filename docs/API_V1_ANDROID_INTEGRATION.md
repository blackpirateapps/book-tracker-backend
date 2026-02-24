# Book Tracker Backend v1 API (Firebase) - Android AI Integration Guide

This document is for an AI agent integrating the Android app with the current backend in this repository.

It describes the **actual implemented API** (Firebase-authenticated, user-scoped, `v1` routes), including:

- Authentication
- User session bootstrap
- Book CRUD
- Incremental sync
- Bulk sync push
- Cover image upload
- Conflict handling
- Error handling

Base URL:

- `https://<your-vercel-domain>`

All responses are JSON unless stated otherwise.

## Important: Legacy API Removed

The older endpoints are **removed** and should not be used:

- `/api/public`
- `/api/books`
- `/api/search`

Use only the `v1` endpoints documented below.

## Authentication (Firebase ID Token)

All `v1` endpoints require Firebase Authentication.

The Android app must:

1. Sign in with Firebase Auth (email/password or another enabled provider)
2. Obtain a Firebase ID token
3. Send the token on every request:

```http
Authorization: Bearer <firebase-id-token>
```

If the token is missing/invalid, the server returns `401`.

## Endpoint Summary

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/v1/me` | `GET` | Yes | Verify token, bootstrap/upsert user profile, get capabilities |
| `/api/v1/books` | `GET` | Yes | List all books for authenticated user |
| `/api/v1/books/:id` | `GET` | Yes | Get one book (with highlights) |
| `/api/v1/books/:id` | `PUT` | Yes | Create or update a book (upsert) |
| `/api/v1/books/:id` | `DELETE` | Yes | Soft-delete a book |
| `/api/v1/sync/changes` | `GET` | Yes | Incremental sync since timestamp |
| `/api/v1/sync/push` | `POST` | Yes | Bulk upload/upsert books |
| `/api/v1/uploads/cover` | `POST` | Yes | Upload cover image (`multipart/form-data`) |

## 1. `GET /api/v1/me` - Session Bootstrap

Verifies the Firebase token and upserts the user into Turso (`users` table).

### Request

```http
GET /api/v1/me
Authorization: Bearer <firebase-id-token>
```

### Response

```json
{
  "user": {
    "id": "firebase_uid_123",
    "email": "user@example.com",
    "displayName": "Jane Reader",
    "photoUrl": "https://...",
    "createdAt": "2026-02-24T23:00:00.000Z",
    "updatedAt": "2026-02-24T23:00:00.000Z"
  },
  "capabilities": {
    "coverUpload": true,
    "backups": false,
    "directSearchProxy": false
  },
  "serverTime": "2026-02-24T23:00:00.000Z"
}
```

### Android integration notes

- Call this after sign-in to validate backend auth and get `serverTime`.
- `directSearchProxy: false` means the app should use its existing direct OpenLibrary/Google Books client flow instead of backend search proxy.
- `coverUpload: true` means image uploads are available at `/api/v1/uploads/cover`.

## 2. `GET /api/v1/books` - Full Book List

Returns **all books owned by the authenticated user**, including highlights.

### Query params

| Param | Type | Default | Description |
|---|---|---|---|
| `includeDeleted` | `true/false` | `true` | Include soft-deleted books for sync clients |

### Request

```http
GET /api/v1/books?includeDeleted=true
Authorization: Bearer <firebase-id-token>
```

### Response

Array of `Book` objects (see schema below).

```json
[
  {
    "id": "book_123",
    "title": "Atomic Habits",
    "author": "James Clear",
    "notes": "",
    "coverUrl": "https://...",
    "coverStorageKey": "covers/firebase_uid_123/1700000000-uuid.jpg",
    "status": "reading",
    "rating": 4,
    "pageCount": 320,
    "progressPercent": 42,
    "medium": "Paperback",
    "startDateIso": "2026-02-20T00:00:00.000Z",
    "endDateIso": null,
    "createdAtIso": "2026-02-20T12:00:00.000Z",
    "updatedAtIso": "2026-02-24T23:00:00.000Z",
    "deletedAtIso": null,
    "version": 3,
    "highlights": [
      {
        "id": "hl_1",
        "position": 0,
        "text": "Small habits compound.",
        "createdAtIso": "2026-02-24T22:59:00.000Z",
        "updatedAtIso": "2026-02-24T22:59:00.000Z"
      }
    ]
  }
]
```

## 3. `GET /api/v1/books/:id` - Single Book

Returns one user-owned book including highlights.

### Request

```http
GET /api/v1/books/book_123
Authorization: Bearer <firebase-id-token>
```

### Responses

- `200` + `Book`
- `404` if not found (or not owned by the user)

## 4. `PUT /api/v1/books/:id` - Upsert Book (Create/Update)

Creates a new book or updates an existing one for the authenticated user.

The route path `:id` is the authoritative book ID. The request body should include the same `id` for consistency, but the server uses the route ID for storage.

### Request body (Book payload)

```json
{
  "id": "book_123",
  "title": "Atomic Habits",
  "author": "James Clear",
  "notes": "Great behavior design ideas.",
  "coverUrl": "https://blob.vercel-storage.com/...",
  "coverStorageKey": "covers/firebase_uid_123/1700000000-uuid.jpg",
  "status": "reading",
  "rating": 4,
  "pageCount": 320,
  "progressPercent": 42,
  "medium": "Paperback",
  "startDateIso": "2026-02-20T00:00:00.000Z",
  "endDateIso": null,
  "createdAtIso": "2026-02-20T12:00:00.000Z",
  "updatedAtIso": "2026-02-24T22:00:00.000Z",
  "clientUpdatedAtIso": "2026-02-24T22:00:00.000Z",
  "deletedAtIso": null,
  "version": 2,
  "baseVersion": 2,
  "highlights": [
    {
      "id": "hl_1",
      "position": 0,
      "text": "Small habits compound.",
      "createdAtIso": "2026-02-24T22:59:00.000Z",
      "updatedAtIso": "2026-02-24T22:59:00.000Z"
    },
    "You can also send a plain string highlight."
  ]
}
```

### Field behavior and defaults

| Field | Type | Notes |
|---|---|---|
| `id` | string | App/client-generated ID (recommended stable local ID) |
| `title` | string | Required (non-empty) |
| `author` | string | Optional; defaults `""` |
| `notes` | string | Optional; defaults `""` |
| `coverUrl` | string | Optional; defaults `""` |
| `coverStorageKey` | string/null | Optional; set from upload response `pathname` |
| `status` | string | Optional; defaults `"reading_list"` |
| `rating` | int | Clamped `0..5` |
| `pageCount` | int | Min `0` |
| `progressPercent` | int | Clamped `0..100` |
| `medium` | string | Optional; defaults `""` |
| `startDateIso` | string/null | Optional |
| `endDateIso` | string/null | Optional |
| `createdAtIso` | string | Optional; server uses current time if missing |
| `updatedAtIso` | string | Optional |
| `clientUpdatedAtIso` | string | If present, preferred over `updatedAtIso` |
| `deletedAtIso` | string/null | Optional; can be used by client sync logic |
| `version` | int | Optional; server ensures version increments on update |
| `baseVersion` | int | Optional; used for conflict detection |
| `highlights` | array | Full replacement list (not patch/append) |

### Highlights behavior (important)

- On every `PUT`, the server **replaces all highlights** for the book with the provided `highlights` array.
- If `highlights` is omitted, it behaves as an empty list (`[]`) and existing highlights are removed.
- Each highlight can be:
  - a `string` (server generates IDs/timestamps)
  - an object with `id`, `position`, `text`, timestamps

### Success response (`200`)

Returns the stored `Book` object (server-normalized, includes final `version` and normalized highlights).

### Conflict response (`409`)

If `baseVersion` is provided and does not match the server version:

```json
{
  "error": "Version conflict",
  "serverBook": {
    "...": "latest server book payload"
  },
  "serverVersion": 5
}
```

### Android integration notes

- Use `baseVersion` from your local copy to detect overwrite conflicts.
- If you get `409`, merge locally or prompt the user, then retry with updated payload.

## 5. `DELETE /api/v1/books/:id` - Soft Delete

Marks a book as deleted instead of removing it, so sync clients can reconcile deletes.

### Request

```http
DELETE /api/v1/books/book_123
Authorization: Bearer <firebase-id-token>
```

### Response (`200`)

```json
{
  "message": "Deleted",
  "deletedAtIso": "2026-02-24T23:10:00.000Z",
  "version": 4
}
```

### Notes

- The row remains in the DB with `deletedAtIso` set.
- It will appear in `/api/v1/books` when `includeDeleted=true`.
- It will show up in `/api/v1/sync/changes` under `bookIdsDeleted`.

## 6. `GET /api/v1/sync/changes?since=<iso>` - Incremental Sync

Fetches all changes for the authenticated user after a timestamp.

### Request

```http
GET /api/v1/sync/changes?since=2026-02-24T00:00:00.000Z
Authorization: Bearer <firebase-id-token>
```

### Response

```json
{
  "booksUpserted": [
    {
      "id": "book_123",
      "title": "Atomic Habits",
      "highlights": []
    }
  ],
  "bookIdsDeleted": ["book_999"],
  "serverNow": "2026-02-24T23:15:00.000Z"
}
```

### Behavior details

- `booksUpserted`: changed books whose `deletedAtIso` is `null`
- `bookIdsDeleted`: changed books whose `deletedAtIso` is set
- Changes are selected by `updatedAtIso > since`
- Missing `since` returns `400`

### Android sync recommendation

1. Store last successful sync time (use `serverNow`)
2. Call `/api/v1/sync/changes?since=<lastSyncTime>`
3. Apply `booksUpserted`
4. Remove/mark deleted `bookIdsDeleted`
5. Save new `serverNow` as last sync time

## 7. `POST /api/v1/sync/push` - Bulk Upsert

Uploads multiple books in one request. Intended for:

- first account migration from local-only data
- offline catch-up sync
- periodic batch sync

### Request

```http
POST /api/v1/sync/push
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

### Body

```json
{
  "books": [
    {
      "id": "book_123",
      "title": "Atomic Habits",
      "author": "James Clear",
      "status": "reading",
      "progressPercent": 42,
      "baseVersion": 2,
      "highlights": [
        { "text": "Small habits compound." }
      ]
    },
    {
      "id": "book_456",
      "title": "Deep Work",
      "status": "reading_list"
    }
  ]
}
```

### Response

```json
{
  "upserted": [
    { "...": "book payload" }
  ],
  "conflicts": [
    {
      "id": "book_123",
      "error": "Version conflict",
      "serverBook": { "...": "book payload" },
      "serverVersion": 3
    }
  ],
  "serverNow": "2026-02-24T23:20:00.000Z"
}
```

### Behavior details

- Books without an `id` are silently skipped.
- Each book is processed as an upsert using the same logic as `PUT /api/v1/books/:id`.
- Conflicts are returned per-book; successful items still succeed.

## 8. `POST /api/v1/uploads/cover` - Cover Image Upload

Uploads a single image file to Vercel Blob in a user-scoped path.

### Request

`multipart/form-data` with field name:

- `file` (required)

Headers:

```http
Authorization: Bearer <firebase-id-token>
```

### Example (curl)

```bash
curl -X POST "$BASE_URL/api/v1/uploads/cover" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -F "file=@/path/to/cover.jpg"
```

### Success response (`200`)

```json
{
  "url": "https://<blob-public-url>",
  "pathname": "covers/firebase_uid_123/1700000000000-uuid.jpg",
  "contentType": "image/jpeg",
  "size": 182394
}
```

### Validation

- Missing file -> `400 { "error": "Missing file" }`
- Non-image MIME type -> `400 { "error": "File must be an image" }`

### Android integration flow (recommended)

1. User picks image on device
2. Upload image to `/api/v1/uploads/cover`
3. Receive `url` + `pathname`
4. Save to the book via `PUT /api/v1/books/:id`:
   - `coverUrl = response.url`
   - `coverStorageKey = response.pathname`

## Book Object Schema (Server Response)

This is the canonical response shape returned by:

- `/api/v1/books`
- `/api/v1/books/:id`
- successful `/api/v1/sync/push` items
- successful `PUT /api/v1/books/:id`

```json
{
  "id": "book_123",
  "title": "Atomic Habits",
  "author": "James Clear",
  "notes": "",
  "coverUrl": "https://...",
  "coverStorageKey": "covers/firebase_uid_123/...",
  "status": "reading",
  "rating": 4,
  "pageCount": 320,
  "progressPercent": 42,
  "medium": "Paperback",
  "startDateIso": "2026-02-20T00:00:00.000Z",
  "endDateIso": null,
  "createdAtIso": "2026-02-20T12:00:00.000Z",
  "updatedAtIso": "2026-02-24T23:00:00.000Z",
  "deletedAtIso": null,
  "version": 3,
  "highlights": [
    {
      "id": "hl_1",
      "position": 0,
      "text": "Small habits compound.",
      "createdAtIso": "2026-02-24T22:59:00.000Z",
      "updatedAtIso": "2026-02-24T22:59:00.000Z"
    }
  ]
}
```

## Error Responses

All errors use:

```json
{ "error": "Description" }
```

Common status codes:

| Status | Meaning |
|---|---|
| `400` | Missing/invalid parameter or body |
| `401` | Missing/invalid Firebase token |
| `404` | Book not found |
| `409` | Version conflict (`PUT` / bulk push per item) |
| `500` | Server error |

## Android Client Implementation Notes (AI Agent Guidance)

### Auth/session

- Use Firebase Auth on-device.
- Refresh ID token when needed and attach to every request.
- Call `/api/v1/me` after sign-in and app startup.

### ID strategy

- Keep client-generated stable IDs (e.g., UUID) for books.
- Reuse the same ID locally and remotely.
- Do not rely on server-generated IDs for books.

### Sync strategy (recommended)

Initial sync:

1. Call `/api/v1/me`
2. Call `/api/v1/books?includeDeleted=true`
3. Replace local server-cache snapshot
4. Save `serverTime` as baseline sync timestamp

Incremental sync loop:

1. Push local pending changes via `/api/v1/sync/push`
2. Pull remote changes via `/api/v1/sync/changes?since=<lastSyncTime>`
3. Apply upserts/deletes locally
4. Save returned `serverNow`

Conflict handling:

1. If `409` on `PUT`, inspect `serverBook`
2. If conflict in `/sync/push`, handle per item
3. Merge or prefer server/client by app policy
4. Retry with updated `baseVersion`

### Cover upload integration

- Upload first, then write the book row with returned `url/pathname`.
- If book save fails after upload, keep the uploaded URL in local draft state and retry later.

### Status values

The backend treats `status` as a plain string (no enum enforcement currently). Keep Android values consistent.

Recommended app values:

- `reading`
- `read`
- `reading_list`
- `abandoned`

## Environment/Backend Requirements (for deployment)

The backend must have these env vars configured:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `BLOB_READ_WRITE_TOKEN`
- Firebase Admin config:
  - `FIREBASE_SERVICE_ACCOUNT_JSON` (recommended)
  - or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

## Quick Smoke Test Sequence (for AI agent or developer)

1. Sign in to Firebase on Android and get ID token
2. `GET /api/v1/me`
3. `POST /api/v1/uploads/cover` with an image
4. `PUT /api/v1/books/<id>` with returned `coverUrl` + `coverStorageKey`
5. `GET /api/v1/books`
6. `GET /api/v1/sync/changes?since=<old timestamp>`

## Source of Truth

This document is derived from the current backend implementation in:

- `app/api/v1/*`
- `lib/server/v1-books.ts`
- `lib/server/firebase.ts`

If behavior differs from this doc, follow the code.
