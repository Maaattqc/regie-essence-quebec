"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { createBrowserClient } from "@/lib/auth";

const ERROR_FR: Record<string, string> = {
  "Token has expired or is invalid": "Le code a expiré ou est invalide. Veuillez en demander un nouveau.",
  "Invalid login credentials": "Identifiants invalides.",
  "Email rate limit exceeded": "Trop de tentatives. Réessayez dans quelques minutes.",
  "For security purposes, you can only request this once every 60 seconds": "Pour des raisons de sécurité, veuillez attendre 60 secondes avant de redemander un code.",
  "User already registered": "Un compte existe déjà avec ce courriel.",
  "Email not confirmed": "Courriel non confirmé.",
  "Invalid email": "Adresse courriel invalide.",
  "Signups not allowed for otp": "Les inscriptions sont désactivées.",
  "Network request failed": "Erreur réseau. Vérifiez votre connexion.",
};

function toFrench(msg: string) {
  return ERROR_FR[msg] ?? Object.entries(ERROR_FR).find(([k]) => msg.toLowerCase().includes(k.toLowerCase()))?.[1] ?? msg;
}

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) setError(toFrench(error.message));
    else setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setLoading(false);
    if (error) setError(toFrench(error.message));
    else setStep("done");
  }

  // Auto-fermer après 2.5s une fois connecté
  useEffect(() => {
    if (step !== "done") return;
    const t = setTimeout(onClose, 1500);
    return () => clearTimeout(t);
  }, [step, onClose]);

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal max-w-[24rem]" style={{ overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Mail className="size-4" />
            <h2 className="text-base font-bold m-0">Connexion</h2>
          </div>
          <span className="panel-close" onClick={onClose}>x</span>
        </div>

        {step === "email" && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-3">
            <p className="text-[0.8125rem] text-[var(--text-secondary)] m-0">
              Entrez votre courriel pour recevoir un code de connexion
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Adresse courriel</label>
              <Input
                type="email"
                placeholder="exemple@courriel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-[0.8125rem] text-destructive m-0">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le code"}
            </Button>
            <p className="text-xs text-muted-foreground m-0 leading-normal">
              Aucun mot de passe requis. Un code à 6 chiffres sera envoyé à votre courriel.
            </p>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
            <p className="text-[0.8125rem] text-[var(--text-secondary)] m-0">
              Un code a été envoyé à <strong>{email}</strong>
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Code de vérification</label>
              <Input
                className="text-center text-2xl tracking-[0.3em] font-mono"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-[0.8125rem] text-destructive m-0">{error}</p>}
            <Button type="submit" disabled={loading || code.length < 6}>
              {loading ? "Vérification..." : "Vérifier le code"}
            </Button>
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); setCode(""); }}
              className="bg-transparent border-none cursor-pointer text-muted-foreground text-[0.8125rem] flex items-center gap-1 p-0"
            >
              <ArrowLeft className="size-3" />
              Changer de courriel
            </button>
          </form>
        )}

        {step === "done" && (
          <motion.div
            className="text-center py-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
            >
              <CheckCircle className="size-12 mx-auto mb-3" style={{ color: "#2d9a2d" }} />
            </motion.div>
            <p className="text-[0.9375rem] font-semibold mb-1" style={{ color: "#2d9a2d" }}>Connexion réussie !</p>
            <p className="text-[0.8125rem] text-muted-foreground">
              Vous êtes maintenant connecté.
            </p>
            <Button onClick={onClose} className="mt-4">Fermer</Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
