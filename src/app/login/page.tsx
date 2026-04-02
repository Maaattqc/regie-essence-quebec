"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Régie Essence Québec</h1>
          <p>Connectez-vous avec votre adresse courriel</p>
        </div>

        {sent ? (
          <div className="login-success">
            <p>Un lien de connexion a été envoyé à <strong>{email}</strong></p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Vérifiez votre boîte de réception et vos courriels indésirables.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              className="login-input"
              type="email"
              placeholder="votre@courriel.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="login-error">{error}</p>}
            <button className="login-btn" type="submit">
              Envoyer le lien de connexion
            </button>
          </form>
        )}

        <a href="/" className="login-back">&larr; Retour à la carte</a>
      </div>
    </div>
  );
}
