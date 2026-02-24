export const metadata = {
  title: "Privacy Policy | BlackPirateX Book Tracker",
};

export default function PrivacyPage() {
  return (
    <main className="section">
      <div className="container panel" style={{ padding: "1.25rem" }}>
        <h1 style={{ marginTop: 0 }}>Privacy Policy</h1>
        <p>
          This Privacy Policy explains how BlackPirateX Book Tracker collects, uses, and stores information when you
          use the app and related services.
        </p>

        <h2>Information We Collect</h2>
        <p>We may collect account and reading-related data necessary to provide syncing and app features, including:</p>
        <ul>
          <li>Account information (such as email address and display name)</li>
          <li>Book library data (titles, authors, reading status, notes, ratings, dates)</li>
          <li>Highlights and uploaded cover images</li>
          <li>Technical information needed to operate and secure the service</li>
        </ul>

        <h2>How We Use Information</h2>
        <ul>
          <li>Provide account sign-in and data sync across devices</li>
          <li>Store and retrieve your book tracking data and highlights</li>
          <li>Maintain security, prevent abuse, and troubleshoot service issues</li>
          <li>Improve app reliability and performance</li>
        </ul>

        <h2>Third-Party Services</h2>
        <p>
          The service may use third-party providers such as Firebase (authentication), Turso (database), Vercel
          (hosting), Vercel Blob (file storage), and OpenLibrary (book metadata search).
        </p>

        <h2>Data Retention</h2>
        <p>
          We retain your data for as long as needed to provide the service, comply with legal obligations, resolve
          disputes, and enforce agreements. You may request deletion of your account data where applicable.
        </p>

        <h2>Security</h2>
        <p>
          We use reasonable technical measures to protect your data. However, no service can guarantee absolute
          security.
        </p>

        <h2>Children&apos;s Privacy</h2>
        <p>
          The service is not intended for children under the age required by applicable law to consent to data
          processing without parental involvement.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Updates will be reflected on this page with a revised
          effective date.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about this Privacy Policy, contact the app operator through the support channel listed
          in the app or store listing.
        </p>

        <p style={{ color: "var(--muted)", marginTop: "1.5rem" }}>Effective date: February 24, 2026</p>
      </div>
    </main>
  );
}
