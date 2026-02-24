export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "BlackPirateX Book Tracker";

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div className="panel hero-copy">
            <span className="kicker">Read More. Remember More.</span>
            <h1>{appName}</h1>
            <p>
              Track what you are reading, keep highlights in one place, and sync your library across devices with a
              clean, fast experience built for serious readers.
            </p>
            <div className="cta-row">
              <a className="btn primary" href="#features">
                Explore Features
              </a>
              <a className="btn" href="#how-it-works">
                How It Works
              </a>
              <a className="btn" href="/privacy">
                Privacy Policy
              </a>
            </div>
          </div>
          <aside className="panel code-card">
            <pre>{`What you can do

- Organize books by status
- Track reading progress
- Save highlights and notes
- Upload custom covers
- Sync your library securely
- Search books via OpenLibrary`}</pre>
          </aside>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <div className="cards">
            <div className="card">
              <h3>Personal Library</h3>
              <p>Organize books into reading, read, reading list, and abandoned shelves with quick updates.</p>
            </div>
            <div className="card">
              <h3>Notes and Highlights</h3>
              <p>Capture ideas while you read and keep highlights attached to the exact book they came from.</p>
            </div>
            <div className="card">
              <h3>Secure Sync</h3>
              <p>Your account data syncs through authenticated APIs so your reading history stays yours.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section">
        <div className="container panel" style={{ padding: "1rem 1.25rem" }}>
          <h2 style={{ marginTop: 0 }}>How It Works</h2>
          <div className="cards" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="card">
              <h3>Create an account</h3>
              <p>Sign up in the mobile app to unlock cloud sync and backup for your reading data.</p>
            </div>
            <div className="card">
              <h3>Add books fast</h3>
              <p>Search by title/author, choose a result, and start tracking progress in seconds.</p>
            </div>
            <div className="card">
              <h3>Track your reading</h3>
              <p>Update status, progress, rating, and dates as you move from reading list to finished.</p>
            </div>
            <div className="card">
              <h3>Keep your highlights</h3>
              <p>Save memorable quotes and notes so they are available whenever you revisit a book.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <a href="/privacy" style={{ marginRight: "1rem" }}>
            Privacy Policy
          </a>
          <a href="/terms">Terms and Conditions</a>
        </div>
      </footer>
    </main>
  );
}
