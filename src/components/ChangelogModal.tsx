"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ChangelogCommit } from "@/components/types";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export type { ChangelogCommit };

export default function ChangelogModal({ onClose }: { onClose: () => void }) {
  const trapRef = useFocusTrap();
  const [commits, setCommits] = useState<ChangelogCommit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => r.json())
      .then((d) => setCommits(d))
      .catch(() => setCommits([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="report-overlay" onClick={onClose} role="presentation">
      <div
        ref={trapRef}
        className="report-modal max-w-[56rem] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="changelog-modal-title"
      >
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h2 id="changelog-modal-title" className="text-base font-bold m-0 flex items-center gap-2">
            <History className="size-4" /> Changelog
          </h2>
          <span className="panel-close" onClick={onClose}>x</span>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <Spinner />
          ) : commits.length === 0 ? (
            <p className="text-muted-foreground text-[0.8125rem]">Aucun commit trouvé.</p>
          ) : (
            <div className="changelog-list">
              {commits.map((c) => (
                <div key={c.sha} className="changelog-item">
                  <div className="changelog-date">
                    {new Date(c.date).toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" })}
                    {" — "}{c.author}
                  </div>
                  <div className="changelog-msg">{c.message}</div>
                  <div className="changelog-sha">{c.sha.slice(0, 7)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
