export const metadata = {
  title: "Privacy Policy | BlackPirateX Book Tracker",
};

export default function PrivacyPage() {
  return (
    <main className="section legal">
      <div className="container panel" style={{ padding: "1.25rem" }}>
        <h1 style={{ marginTop: 0 }}>Privacy Policy</h1>
        <p>
          This Privacy Policy explains how BlackPirateX Book Tracker (&quot;we,&quot; &quot;our,&quot; or &quot;the Service&quot;) collects,
          uses, stores, and discloses information when you use the mobile application and related sync services.
        </p>
        <p>
          BlackPirateX Book Tracker is a reading tracker that allows users to maintain a personal library, track
          reading progress, save notes and highlights, upload custom cover images, and sync data across devices.
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect information necessary to operate the Service and provide core app functionality.</p>
        <ul>
          <li>Account information provided by Firebase Authentication, such as email address, display name, and user ID.</li>
          <li>
            Reading library data you create or sync, including book titles, authors, statuses, ratings, reading
            progress, notes, and reading dates.
          </li>
          <li>Highlights and text excerpts you save to books in your library.</li>
          <li>Cover images you upload for your books and related storage path metadata.</li>
          <li>
            Technical and operational data reasonably required to provide and secure the Service (for example request
            metadata, error logs, and service diagnostics).
          </li>
        </ul>

        <h2>2. How We Use Information</h2>
        <ul>
          <li>Authenticate users and associate synced data with the correct account.</li>
          <li>Store, sync, retrieve, and update your books, highlights, notes, and reading progress across devices.</li>
          <li>Provide search-assisted add-book workflows using third-party metadata sources.</li>
          <li>Store and serve uploaded cover images for use in the app.</li>
          <li>Maintain service security, detect abuse, and troubleshoot failures.</li>
          <li>Improve reliability, performance, and compatibility of the Service.</li>
        </ul>

        <h2>3. Third-Party Services and Data Sources</h2>
        <p>
          We use third-party providers to operate the Service. These may include Firebase (authentication), Turso
          (database infrastructure), Vercel (hosting), Vercel Blob (file storage), and OpenLibrary or similar metadata
          sources for book search and discovery. These providers may process data as needed to deliver their services.
        </p>
        <p>
          Book metadata retrieved through search (such as titles, authors, publication data, and cover references) may
          come from third-party sources and may be subject to their availability and policies.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          We retain your account and synced content for as long as reasonably necessary to provide the Service, comply
          with legal obligations, resolve disputes, and enforce agreements. If you stop using the Service, some data
          may remain in backups or logs for a limited period consistent with operational and legal requirements.
        </p>
        <p>You may request deletion of account-associated data where applicable and subject to technical limitations.</p>

        <h2>5. Security</h2>
        <p>
          We use reasonable administrative, technical, and organizational measures designed to protect information
          against unauthorized access, loss, misuse, or alteration. No method of transmission or storage is completely
          secure, and we cannot guarantee absolute security.
        </p>

        <h2>6. Children&apos;s Privacy</h2>
        <p>
          The Service is not directed to children under the age at which personal data processing requires parental
          consent under applicable law. If you believe a child has provided personal information without appropriate
          consent, please contact us.
        </p>

        <h2>7. Your Choices</h2>
        <p>
          You may choose what reading content, notes, highlights, and cover images to store in the Service. You may
          also stop using the Service at any time. Account-level actions such as changing email/password or verifying
          email are managed through Firebase Authentication.
        </p>

        <h2>8. International Processing</h2>
        <p>
          Depending on the infrastructure providers used, your information may be processed or stored in jurisdictions
          other than your own. By using the Service, you acknowledge that such transfers may occur subject to
          applicable safeguards and provider practices.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in the Service, legal requirements, or
          operational practices. When we do, we will update the effective date on this page.
        </p>

        <h2>10. Contact</h2>
        <p>
          If you have questions about this Privacy Policy or your data, contact the app operator through the support
          channel listed in the application or app store listing.
        </p>

        <p style={{ color: "var(--muted)", marginTop: "1.5rem" }}>Effective date: February 24, 2026</p>
      </div>
    </main>
  );
}
