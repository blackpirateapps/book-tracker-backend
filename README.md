# Book Tracker Backend (Next.js + Turso)

This repository now contains a deployable Next.js app for Vercel with:

- A landing page at `/`
- Android-compatible API routes from `docs/API_DOCS.md`
  - `GET /api/public`
  - `GET/POST /api/books`
  - `GET /api/search`
- A Firebase-ready bootstrap endpoint for future authenticated sync:
  - `GET /api/v1/me` (verifies Firebase ID token)

## What This Implements (Now)

- Turso-backed storage for books and tags
- Admin password protected write API (`/api/books` `POST`)
- OpenLibrary search + add flow
- Public read APIs (browse/search/stats/random highlight/tags)
- Hugo export payload (`/api/books?action=export-hugo`)

## What Is Stubbed (Future)

- `/api/v1/books`
- `/api/v1/sync/changes`
- `/api/v1/sync/push`

These return `501` and are intended to be built from `docs/API_AGENT_BACKEND_BUILD_SPEC.md`.

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

## Vercel Setup (Deploy)

1. Push this repo to GitHub/GitLab/Bitbucket.

2. In Vercel, create a new project and import the repo.

3. Framework preset should be detected as `Next.js`.

4. Add environment variables in Vercel Project Settings:

- `ADMIN_PASSWORD` (required for `/api/books` POST)
- `TURSO_DATABASE_URL` (required)
- `TURSO_AUTH_TOKEN` (required)
- `NEXT_PUBLIC_APP_NAME` (optional branding text)

5. Deploy.

6. After deploy, your base URL will be:

- `https://<project>.vercel.app`

Use that as the Android app backend base URL.

### Android App Integration

Based on `docs/API_DOCS.md`, the app should call:

- `GET /api/public`
- `GET/POST /api/books`
- `GET /api/search`

If the Android app has a configurable backend URL setting, set it to your Vercel base URL (no trailing slash).

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

### Search OpenLibrary

```bash
curl "$BASE_URL/api/search?q=atomic+habits"
```

### Add a Book (Admin)

```bash
curl -X POST "$BASE_URL/api/books" \
  -H "Content-Type: application/json" \
  -d '{
    "password":"'"$ADMIN_PASSWORD"'",
    "action":"add",
    "data":{"olid":"OL82563W","shelf":"currentlyReading"}
  }'
```

### List Public Books

```bash
curl "$BASE_URL/api/public?limit=20&offset=0"
```

## Notes / Tradeoffs

- `action: "add"` pulls metadata from OpenLibrary and stores a remote cover URL. It does not currently download/compress/store covers in Vercel Blob.
- `/api/v1/*` sync endpoints are intentionally scaffolded but not fully implemented yet.
- The current implementation stores several fields as JSON strings to match the Android API docs and existing client expectations.

## Suggested Next Step (Backend)

Implement the full Firebase user-scoped sync API from `docs/API_AGENT_BACKEND_BUILD_SPEC.md` in parallel with the existing `/api/*` routes so old and new app clients can coexist during migration.
