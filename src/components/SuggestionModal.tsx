"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, Send, X } from "lucide-react";
import { suggestionSchema } from "@/lib/schemas";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SuggestionModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const trapRef = useFocusTrap();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const validation = suggestionSchema.safeParse(form);
    if (!validation.success) {
      const errs: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const key = String(issue.path[0]);
        if (!errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }

    setSending(true);
    const res = await fetch("/api/suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json();
      setError(data.error || "Erreur");
    }
    setSending(false);
  }

  return (
    <div className="report-overlay" onClick={onClose} role="presentation">
      <motion.div
        ref={trapRef}
        className="report-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "28rem" }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggestion-modal-title"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 id="suggestion-modal-title" style={{ fontSize: "1.0625rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Lightbulb className="size-4" style={{ color: "#f59e0b" }} />
            {t.suggestion.title}
          </h2>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Fermer"><X className="size-4" /></button>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          {t.suggestion.subtitle}
        </p>

        {sent ? (
          <motion.div
            style={{ textAlign: "center", padding: "1.5rem 0" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p style={{ fontSize: "0.9375rem", fontWeight: 600 }}>{t.suggestion.successTitle}</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{t.suggestion.successSubtitle}</p>
            <Button onClick={onClose} className="mt-3">Fermer</Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ flex: 1 }}>
                <Input
                  placeholder={t.suggestion.firstNameLabel}
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  aria-invalid={!!fieldErrors.first_name}
                />
                {fieldErrors.first_name && <p style={{ fontSize: "0.75rem", color: "#e63946", marginTop: "0.125rem" }}>{fieldErrors.first_name}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <Input
                  placeholder={t.suggestion.lastNameLabel}
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  aria-invalid={!!fieldErrors.last_name}
                />
                {fieldErrors.last_name && <p style={{ fontSize: "0.75rem", color: "#e63946", marginTop: "0.125rem" }}>{fieldErrors.last_name}</p>}
              </div>
            </div>
            <div>
              <Input
                type="email"
                placeholder={t.suggestion.emailLabel}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <p style={{ fontSize: "0.75rem", color: "#e63946", marginTop: "0.125rem" }}>{fieldErrors.email}</p>}
            </div>
            <div>
              <textarea
                className="login-input"
                style={{ minHeight: "80px", resize: "vertical", width: "100%" }}
                placeholder={t.suggestion.descriptionPlaceholder}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                aria-invalid={!!fieldErrors.message}
                rows={4}
              />
              {fieldErrors.message && <p style={{ fontSize: "0.75rem", color: "#e63946", marginTop: "0.125rem" }}>{fieldErrors.message}</p>}
            </div>
            {error && <p style={{ fontSize: "0.875rem", color: "#e63946" }}>{error}</p>}
            <button className="login-btn" type="submit" disabled={sending} style={{ background: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}>
              <Send className="size-3.5" />
              {sending ? t.suggestion.sending : t.suggestion.submit}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
