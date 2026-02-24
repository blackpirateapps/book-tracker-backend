const endpoints = [
  { path: "/api/public", description: "Public browse/search/stats API used by the app" },
  { path: "/api/books", description: "Admin read/write API for books, tags, and highlights" },
  { path: "/api/search", description: "OpenLibrary search passthrough for add flow" },
  { path: "/api/v1/me", description: "Firebase token verification bootstrap (future sync API)" },
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
              Deployable on Vercel with a landing page and API routes matching the Android app docs in this repository.
              Turso stores books/tags, and Firebase is wired for future authenticated sync endpoints.
            </p>
            <div className="cta-row">
              <a className="btn primary" href="/api/public">
                Try Public API
              </a>
              <a className="btn" href="/api/books?action=export-hugo">
                Export Endpoint
              </a>
              <a className="btn" href="https://vercel.com/new" target="_blank" rel="noreferrer">
                Deploy to Vercel
              </a>
            </div>
          </div>
          <aside className="panel code-card">
            <pre>{`curl "$BASE_URL/api/search?q=atomic+habits"

curl -X POST "$BASE_URL/api/books" \\
  -H "Content-Type: application/json" \\
  -d '{
    "password":"$ADMIN_PASSWORD",
    "action":"update",
    "data":{"id":"OL82563W","readingProgress":75}
  }'`}</pre>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cards">
            <div className="card">
              <h3>Android-compatible routes</h3>
              <p>Implements the documented endpoints so the existing app client can connect without changing route names.</p>
            </div>
            <div className="card">
              <h3>Turso storage</h3>
              <p>LibSQL client with SQLite schema for books and tags, plus lazy schema creation and SQL migrations in `db/migrations`.</p>
            </div>
            <div className="card">
              <h3>Firebase-ready</h3>
              <p>
                Includes Firebase Admin token verification helper and <code>/api/v1/me</code> to validate auth setup before full sync routes.
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
        <div className="container">See `README.md` for Firebase, Turso, and Vercel setup instructions.</div>
      </footer>
    </main>
  );
}
