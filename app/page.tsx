const endpoints = [
  { path: "/api/v1/me", description: "Firebase token verification + user bootstrap" },
  { path: "/api/v1/books", description: "List all books for the authenticated user" },
  { path: "/api/v1/books/:id", description: "Get, upsert, or soft-delete a user book" },
  { path: "/api/v1/search", description: "OpenLibrary search proxy for add-book flows" },
  { path: "/api/v1/sync/changes", description: "Incremental sync feed for a user" },
  { path: "/api/v1/sync/push", description: "Bulk push local books to server" },
  { path: "/api/v1/uploads/cover", description: "Image upload endpoint (multipart/form-data)" },
];

export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "BlackPirateX Book Tracker";

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="panel hero-copy">
            <span className="kicker">Book Tracker Backend • Next.js + Turso</span>
            <h1>{appName}</h1>
            <p>
              Deployable on Vercel with a Firebase-authenticated API for per-user book sync and cover uploads.
              Turso stores user data and Vercel Blob stores uploaded images.
            </p>
            <div className="cta-row">
              <a className="btn primary" href="/api/v1/me">
                Test /api/v1/me
              </a>
              <a className="btn" href="/api/v1/books">
                Books Endpoint
              </a>
              <a className="btn" href="/api/v1/search?q=atomic+habits">
                Search Proxy
              </a>
              <a className="btn" href="https://vercel.com/new" target="_blank" rel="noreferrer">
                Deploy to Vercel
              </a>
            </div>
          </div>
          <aside className="panel code-card">
            <pre>{`curl "$BASE_URL/api/v1/me" \\
  -H "Authorization: Bearer <firebase-id-token>"

curl "$BASE_URL/api/v1/search?q=atomic+habits" \\
  -H "Authorization: Bearer <firebase-id-token>"

curl -X POST "$BASE_URL/api/v1/uploads/cover" \\
  -H "Authorization: Bearer <firebase-id-token>" \\
  -F "file=@cover.jpg"`}</pre>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cards">
            <div className="card">
              <h3>Firebase user auth</h3>
              <p>All user data and uploads are protected with Firebase ID token verification on every request.</p>
            </div>
            <div className="card">
              <h3>Turso storage</h3>
              <p>LibSQL client with user-owned books/highlights tables, plus lazy schema creation and SQL migrations.</p>
            </div>
            <div className="card">
              <h3>Cover uploads</h3>
              <p>
                <code>/api/v1/uploads/cover</code> accepts an image file and stores it in Vercel Blob for per-user cover hosting.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container panel" style={{ padding: "1rem 1.25rem" }}>
          <h2 style={{ marginTop: 0 }}>Available Endpoints</h2>
          <div className="cards" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {endpoints.map((item) => (
              <div className="card" key={item.path}>
                <h3 style={{ marginBottom: ".4rem" }}>
                  <code>{item.path}</code>
                </h3>
                <p style={{ margin: 0 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">See `README.md` for Firebase, Turso, Vercel Blob, and Vercel setup instructions.</div>
      </footer>
    </main>
  );
}
