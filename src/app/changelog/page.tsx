"use client";

import { useEffect, useState } from "react";

interface Commit {
  sha: string;
  date: string;
  message: string;
  author: string;
}

export default function ChangelogPage() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => r.json())
      .then((d) => setCommits(d))
      .catch(() => setCommits([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <header className="gov-bar">
        <div className="gov-bar-title">
          <div>
            Changelog
            <div className="gov-bar-subtitle">Historique des modifications</div>
          </div>
        </div>
        <div className="gov-bar-right">
          <a href="/" className="gov-bar-back-link">&larr; Retour à la carte</a>
        </div>
        <div className="gov-bar-accent" />
      </header>

      <div className="admin-content" style={{ maxWidth: "43.75rem", margin: "0 auto", paddingTop: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Changelog</h1>

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Chargement...</p>
        ) : commits.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Aucun commit trouvé.</p>
        ) : (
          <div className="changelog-list">
            {commits.map((c) => (
              <div key={c.sha} className="changelog-item">
                <div className="changelog-date">
                  {new Date(c.date).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" })}
                  {" - "}
                  <span style={{ color: "var(--text-secondary)" }}>{c.author}</span>
                </div>
                <div className="changelog-msg">{c.message}</div>
                <div className="changelog-sha">{c.sha.slice(0, 7)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
