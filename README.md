# Book Tracker Backend (Next.js + Turso)

This repository contains a deployable Next.js backend for Vercel with:

- A landing page at `/`
- Firebase-authenticated user API routes:
  - `GET /api/v1/me`
  - `GET /api/v1/books`
  - `GET/PUT/DELETE /api/v1/books/:id`
  - `GET /api/v1/sync/changes`
  - `POST /api/v1/sync/push`
  - `POST /api/v1/uploads/cover` (multipart image upload to Vercel Blob)

## What This Implements (Now)

- Firebase ID token verification (`Authorization: Bearer ...`)
- Turso-backed user-scoped books + highlights + users
- Incremental sync (`/api/v1/sync/changes`)
- Bulk sync push (`/api/v1/sync/push`)
- Cover image upload to Vercel Blob (`/api/v1/uploads/cover`)

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy env file and fill secrets:

```bash
cp .env.example .env.local
```

3. Run dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Turso Setup (Database)

1. Install and log in to the Turso CLI.

2. Create a database:

```bash
turso db create book-tracker
```

3. Get the database URL:

```bash
turso db show --url book-tracker
```

4. Create a database auth token:

```bash
turso db tokens create book-tracker
```

5. Set these in `.env.local` (and later in Vercel):

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

6. Create schema (one-time).

Option A: Use Turso shell and paste `db/migrations/001_initial_schema.sql`.

```bash
turso db shell book-tracker
```

Option B: Pipe the migration file (if your shell/CLI setup supports it):

```bash
turso db shell book-tracker < db/migrations/001_initial_schema.sql
```

Note: The app also lazily creates the required tables on first request, but running the migration explicitly is better for repeatable setup.

## Vercel Blob Setup (Cover Uploads)

1. In Vercel, open your project.
2. Go to `Storage` and create a `Blob` store.
3. Vercel will provide a `BLOB_READ_WRITE_TOKEN`.
4. Add it to local `.env.local` and Vercel env vars.

Required env var:

- `BLOB_READ_WRITE_TOKEN`

## Vercel Setup (Deploy)

1. Push this repo to GitHub/GitLab/Bitbucket.

2. In Vercel, create a new project and import the repo.

3. Framework preset should be detected as `Next.js`.

4. Add environment variables in Vercel Project Settings:

- `TURSO_DATABASE_URL` (required)
- `TURSO_AUTH_TOKEN` (required)
- `BLOB_READ_WRITE_TOKEN` (required for uploads)
- Firebase Admin env vars (required for authenticated routes)
- `NEXT_PUBLIC_APP_NAME` (optional branding text)

5. Deploy.

6. After deploy, your base URL will be:

- `https://<project>.vercel.app`

Use that as the Android app backend base URL.

### Android App Integration

Use the new authenticated base URL with these endpoints:

- `GET /api/v1/me`
- `GET /api/v1/books`
- `GET/PUT/DELETE /api/v1/books/:id`
- `GET /api/v1/sync/changes?since=<iso>`
- `POST /api/v1/sync/push`
- `POST /api/v1/uploads/cover` (multipart file field name: `file`)

Set the Android app backend URL to your Vercel base URL (no trailing slash).

## Firebase Setup (For `/api/v1/me` and Future Sync)

This project includes Firebase Admin verification on the server so your Flutter/Android app can send `Authorization: Bearer <idToken>`.

### 1. Create Firebase Project

1. Go to Firebase Console and create/select a project.
2. Add your Android app package later (per app-side integration).

### 2. Enable Authentication

1. Open `Authentication`.
2. Open `Sign-in method`.
3. Enable `Email/Password` (matches your future sync spec).

### 3. Create a Service Account (Server-side)

1. In Firebase project settings, open `Service accounts`.
2. Generate a new private key JSON.
3. Store it securely.

### 4. Add Firebase Admin Secrets to Vercel / `.env.local`

You can use either:

Option A (recommended for simplicity in Vercel):

- `FIREBASE_SERVICE_ACCOUNT_JSON` = minified JSON string contents of the service account key

Option B (split fields):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (keep newline escapes as `\\n` in env var value)

### 5. Test Firebase Server Verification

After the mobile app signs in with Firebase Auth and obtains an ID token, call:

```bash
curl "$BASE_URL/api/v1/me" \
  -H "Authorization: Bearer <firebase-id-token>"
```

Expected result: user profile + server capabilities JSON.

## API Examples

### Bootstrap User Session

```bash
curl "$BASE_URL/api/v1/me" \
  -H "Authorization: Bearer <firebase-id-token>"
```

### List User Books

```bash
curl "$BASE_URL/api/v1/books?includeDeleted=true" \
  -H "Authorization: Bearer <firebase-id-token>"
```

### Upsert a Book

```bash
curl -X PUT "$BASE_URL/api/v1/books/book_123" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id":"book_123",
    "title":"Atomic Habits",
    "author":"James Clear",
    "status":"reading",
    "progressPercent":42,
    "highlights":[{"text":"Small habits compound."}]
  }'
```

### Upload a Cover Image

```bash
curl -X POST "$BASE_URL/api/v1/uploads/cover" \
  -H "Authorization: Bearer <firebase-id-token>" \
  -F "file=@/path/to/cover.jpg"
```

## Notes / Tradeoffs

- Legacy unauthenticated/admin routes (`/api/public`, `/api/books`, `/api/search`) were removed.
- Upload endpoint stores files in Vercel Blob and returns a public URL/pathname for saving on the book row.
- The `v1` schema is user-scoped and separate from the earlier prototype tables.
