"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Commit {
  sha: string;
  date: string;
  message: string;
  author: string;
}

const content = {
  fr: {
    title: "Changelog",
    subtitle: "Historique des modifications",
    backLink: "\u2190 Retour à la carte",
    heading: "Changelog",
    loading: "Chargement...",
    empty: "Aucun commit trouvé.",
  },
  en: {
    title: "Changelog",
    subtitle: "Change history",
    backLink: "\u2190 Back to map",
    heading: "Changelog",
    loading: "Loading...",
    empty: "No commits found.",
  },
};

export default function ChangelogContent() {
  const { locale } = useLanguage();
  const t = content[locale];
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => r.json())
      .then((d) => setCommits(d))
      .catch(() => setCommits([]))
      .finally(() => setLoading(false));
  }, []);

  const dateLocale = locale === "fr" ? "fr-CA" : "en-CA";

  return (
    <div className="admin-page">
      <header className="gov-bar">
        <div className="gov-bar-title">
          <div>
            {t.title}
            <div className="gov-bar-subtitle">{t.subtitle}</div>
          </div>
        </div>
        <div className="gov-bar-right">
          <Link href="/" className="gov-bar-back-link">
            {t.backLink}
          </Link>
        </div>
        <div className="gov-bar-accent" />
      </header>

      <div
        className="admin-content"
        style={{ maxWidth: "43.75rem", margin: "0 auto", paddingTop: "2rem" }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          {t.heading}
        </h1>

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>{t.loading}</p>
        ) : commits.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>{t.empty}</p>
        ) : (
          <div className="changelog-list">
            {commits.map((c) => (
              <div key={c.sha} className="changelog-item">
                <div className="changelog-date">
                  {new Date(c.date).toLocaleDateString(dateLocale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
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
